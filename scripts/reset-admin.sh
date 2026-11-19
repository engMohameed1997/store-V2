#!/bin/bash
# ============================================
# Restore access to a staff (admin panel) account
# Usage (on the server, from the project dir): ./scripts/reset-admin.sh
#
# Staff sign in at /mx-panel with email + password and have no reset email,
# so this sets the account's sign-in email and a new password, clears the
# lockout, activates it and signs out its open sessions.
# The password is typed at a hidden prompt; only its bcrypt hash leaves this
# shell (piped through stdin, never in argv or shell history).
# ============================================
set -euo pipefail

DOCKER=(docker)
docker info >/dev/null 2>&1 || DOCKER=(sudo docker)

die() { echo "❌ $*" >&2; exit 1; }

psql_db() {
    "${DOCKER[@]}" exec -i store-db sh -c \
        'exec psql -X -q -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" "$@"' psql "$@"
}
# For -c queries: keeps `docker exec -i` from eating input meant for the prompts.
query() { psql_db "$@" </dev/null; }

# ── Step 1: Pick the staff account ─────────────────────────────────────────
echo ""
echo "👤 Staff accounts:"
query -P pager=off -c "SELECT id, email, phone, role, status,
    failed_login_attempts AS failed, locked_until
  FROM users WHERE role <> 'CUSTOMER' ORDER BY created_at;"

STAFF_IDS=$(query -tA -c "SELECT id FROM users WHERE role <> 'CUSTOMER';")
if [[ -n $STAFF_IDS && $STAFF_IDS != *$'\n'* ]]; then
    read -rp "Account id to fix [Enter = $STAFF_IDS]: " USER_ID
    USER_ID=${USER_ID:-$STAFF_IDS}
else
    read -rp "Account id to fix (first column above): " USER_ID
fi
[[ $USER_ID =~ ^[A-Za-z0-9_-]{1,64}$ ]] || die "Invalid id."
ROLE=$(query -tA -c "SELECT role FROM users WHERE id = '$USER_ID';")
[[ -n $ROLE ]] || die "No account with id $USER_ID."
[[ $ROLE != CUSTOMER ]] || die "That is a customer account (customers use Google)."

# ── Step 2: Sign-in email ──────────────────────────────────────────────────
read -rp "New sign-in email (Enter = keep current): " EMAIL
EMAIL=$(printf '%s' "$EMAIL" | tr -d '[:space:]' | tr '[:upper:]' '[:lower:]')
SET_EMAIL=""
if [[ -n $EMAIL ]]; then
    [[ $EMAIL =~ ^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$ ]] || die "Invalid email."
    TAKEN=$(query -tA -c "SELECT role FROM users
        WHERE lower(email) = '$EMAIL' AND id <> '$USER_ID';")
    [[ -z $TAKEN ]] || die "$EMAIL already belongs to another ($TAKEN) account. Use a different email."
    SET_EMAIL="email = '$EMAIL', email_verified = true,"
fi

# ── Step 3: New password (hidden) ──────────────────────────────────────────
read -rsp "New password (min 12 chars): " PASSWORD; echo
read -rsp "Repeat password: " PASSWORD2; echo
[[ $PASSWORD == "$PASSWORD2" ]] || die "Passwords do not match."
(( ${#PASSWORD} >= 12 )) || die "Password is shorter than 12 characters."

# Same library and cost as AuthService (bcryptjs, 12 rounds).
HASH=$(printf '%s' "$PASSWORD" | "${DOCKER[@]}" exec -i store-app node -e '
let s = "";
process.stdin.setEncoding("utf8")
  .on("data", (d) => (s += d))
  .on("end", () => process.stdout.write(require("bcryptjs").hashSync(s, 12)));')
unset PASSWORD PASSWORD2
[[ $HASH =~ ^\$2[aby]\$12\$[./A-Za-z0-9]{53}$ ]] || die "Hashing failed."

# ── Step 4: Apply ──────────────────────────────────────────────────────────
psql_db <<SQL
BEGIN;
UPDATE users SET $SET_EMAIL
    password_hash = '$HASH',
    failed_login_attempts = 0,
    locked_until = NULL,
    status = 'ACTIVE',
    updated_at = now()
  WHERE id = '$USER_ID' AND role <> 'CUSTOMER';
UPDATE api_tokens SET is_revoked = true WHERE user_id = '$USER_ID' AND NOT is_revoked;
COMMIT;
SQL

echo ""
query -P pager=off -c "SELECT email, role, status FROM users WHERE id = '$USER_ID';"
echo "✅ Done. Sign in at https://<your-domain>/mx-panel with this email and the new password."
