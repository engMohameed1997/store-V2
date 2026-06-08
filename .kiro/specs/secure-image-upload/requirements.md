# Requirements Document

## Introduction

This feature hardens the existing image upload capability of the store application so that
all images entering the system come exclusively from trusted, locally uploaded files that
have been verified, sanitized, and re-encoded before storage. It replaces the current
upload endpoint (`src/app/api/v1/uploads/route.ts`) and the admin/dashboard pages that
currently accept free-text external image URLs (for example the Banners, Brands, Categories,
and Products pages under `src/app/(admin)/mx-panel/`).

The goal is to eliminate file-upload attack classes identified by OWASP: content-type
spoofing, image polyglots, scripts disguised as images, path traversal, remote code
execution from the upload directory, metadata leakage (EXIF/GPS), and denial of service
from oversized uploads. External image URLs supplied by users are forbidden; every stored
image is a freshly re-encoded copy produced by a trusted image-processing library.

This scope covers the server-side Upload_Service, the Image_Processor, the storage layer,
the admin Upload_Component used by dashboard pages, and the security headers governing
image display.

## Glossary

- **Upload_Service**: The server-side API route handler that receives uploaded files, orchestrates validation and processing, and persists the result. Replaces `POST /api/v1/uploads`.
- **Image_Processor**: The server-side module that verifies, re-encodes, strips metadata, resizes, and validates image data using a trusted image-processing library (sharp).
- **File_Validator**: The component that determines a file's real format from its byte content (magic bytes) rather than its declared MIME type or extension.
- **Storage_Provider**: The abstraction that persists processed image bytes to a storage location, either the local filesystem or a configured secure cloud bucket.
- **Upload_Component**: The admin/dashboard client UI control that lets an Administrator select an image file from the local device and submit it to the Upload_Service.
- **Administrator**: An authenticated user whose role is `ADMIN` or `SUPER_ADMIN`, as enforced by the existing `requireAdmin` guard.
- **Allowed_Format**: One of the image formats permitted by the system: JPEG, PNG, or WEBP.
- **Processed_Copy**: A new image file produced by the Image_Processor by fully re-encoding the decoded pixel data; it contains no metadata from the original upload.
- **Thumbnail**: A reduced-dimension Processed_Copy derived only from the Processed_Copy of the main image.
- **Max_File_Size**: The configured maximum accepted size in bytes for an uploaded file.
- **Max_Dimensions**: The configured maximum width and height in pixels for a Processed_Copy.
- **Safe_Filename**: A server-generated random identifier (UUID) used as the stored filename, with an extension derived from the verified Allowed_Format.
- **Storage_Root**: The configured base directory or bucket where processed images are stored, located outside any directory from which the web server executes code.
- **EXIF/Metadata**: Embedded metadata in image files including EXIF, GPS, IPTC, and XMP segments.
- **CSP**: Content Security Policy, an HTTP response header that constrains the origins from which resources such as images may be loaded.

## Requirements

### Requirement 1: Restrict uploads to local device files

**User Story:** As an Administrator, I want to add images only by uploading a file from my device, so that no untrusted external image URL can enter the system.

#### Acceptance Criteria

1. THE Upload_Component SHALL provide a file selection input that accepts a single image file from the local device.
2. THE Upload_Component SHALL omit any input field that accepts an external image URL.
3. WHEN an Administrator submits an image, THE Upload_Component SHALL transmit the selected file to the Upload_Service as multipart form data.
4. WHERE a dashboard page previously stored an external image URL, THE dashboard page SHALL store only a URL returned by the Upload_Service for a Processed_Copy.
5. IF a request body contains an external image URL instead of an uploaded file, THEN THE Upload_Service SHALL reject the request with a validation error.

### Requirement 2: Authentication and authorization

**User Story:** As a system owner, I want only authorized administrators to upload images, so that the upload endpoint cannot be abused by anonymous or unprivileged users.

#### Acceptance Criteria

1. WHEN an unauthenticated request is sent to the Upload_Service, THE Upload_Service SHALL respond with an authentication error and SHALL NOT process the file.
2. IF an authenticated user without the Administrator role sends a request to the Upload_Service, THEN THE Upload_Service SHALL respond with an authorization error and SHALL NOT process the file.
3. WHEN an Administrator sends a request to the Upload_Service, THE Upload_Service SHALL proceed with validation and processing.

### Requirement 3: Real file-type verification

**User Story:** As a security engineer, I want the system to verify each file's true type from its byte content, so that content-type spoofing and disguised files are rejected.

#### Acceptance Criteria

1. WHEN a file is received, THE File_Validator SHALL determine the file format from the file's leading bytes (magic bytes).
2. THE Upload_Service SHALL accept a file only WHERE the byte-detected format is JPEG, PNG, or WEBP.
3. IF the byte-detected format is not an Allowed_Format, THEN THE Upload_Service SHALL reject the request with a validation error identifying the rejected format.
4. IF the byte-detected format conflicts with the client-supplied MIME type, THEN THE Upload_Service SHALL reject the request with a validation error.
5. THE Upload_Service SHALL ignore the uploaded file's original extension when determining whether the file is an Allowed_Format.

### Requirement 4: Reject malicious and polyglot content

**User Story:** As a security engineer, I want files containing executable or polyglot content to be rejected, so that image-polyglot and script-in-image attacks cannot reach storage.

#### Acceptance Criteria

1. IF a received file fails to decode as a valid Allowed_Format image, THEN THE Image_Processor SHALL reject the file with a validation error.
2. IF a received file is detected as containing an embedded script signature, such as a PHP open tag, THEN THE Upload_Service SHALL reject the request with a validation error.
3. THE Upload_Service SHALL persist only the Processed_Copy produced by re-encoding decoded pixel data, so that any trailing or appended non-image bytes are discarded.
4. THE Upload_Service SHALL NOT accept SVG files.

### Requirement 5: Image re-encoding and metadata stripping

**User Story:** As a privacy and security engineer, I want every stored image to be a freshly re-encoded, metadata-free copy, so that hidden payloads and personal data (such as GPS coordinates) are removed.

#### Acceptance Criteria

1. WHEN a file passes validation, THE Image_Processor SHALL decode the image and re-encode it into a new Processed_Copy in its Allowed_Format.
2. THE Image_Processor SHALL remove all EXIF/Metadata, including GPS, IPTC, and XMP segments, from the Processed_Copy.
3. THE Upload_Service SHALL persist the Processed_Copy and SHALL NOT persist the original uploaded bytes.
4. WHEN re-encoding completes, THE Image_Processor SHALL validate that the Processed_Copy decodes as a valid Allowed_Format image with readable dimensions before it is persisted.
5. IF post-processing validation of the Processed_Copy fails, THEN THE Upload_Service SHALL discard the Processed_Copy and respond with a processing error.

### Requirement 6: Size and dimension limits

**User Story:** As a system operator, I want enforced size and dimension limits, so that oversized uploads cannot cause denial of service or exhaust resources.

#### Acceptance Criteria

1. IF an uploaded file exceeds the Max_File_Size, THEN THE Upload_Service SHALL reject the request with a validation error stating the limit and SHALL NOT decode the file.
2. IF the decoded image width or height exceeds the Max_Dimensions, THEN THE Image_Processor SHALL resize the image to fit within the Max_Dimensions while preserving aspect ratio.
3. THE Image_Processor SHALL constrain decoding resources so that a malformed or decompression-bomb image is rejected rather than fully expanded in memory.
4. THE Upload_Service SHALL define Max_File_Size and Max_Dimensions as named configuration values.

### Requirement 7: Safe filename generation

**User Story:** As a security engineer, I want stored files to use server-generated random names, so that path traversal and filename-based attacks are prevented.

#### Acceptance Criteria

1. WHEN a Processed_Copy is persisted, THE Upload_Service SHALL assign a Safe_Filename generated as a UUID.
2. THE Upload_Service SHALL derive the stored file extension from the verified Allowed_Format and SHALL NOT use the original uploaded extension.
3. THE Upload_Service SHALL NOT include any portion of the original uploaded filename in the stored filename.
4. WHEN constructing the storage path, THE Upload_Service SHALL confine the resolved path within the Storage_Root.
5. IF a requested storage subfolder value resolves outside the Storage_Root, THEN THE Upload_Service SHALL reject the request with a validation error.

### Requirement 8: Secure storage location and no script execution

**User Story:** As a system operator, I want images stored where they cannot be executed, so that an uploaded file can never run as server code.

#### Acceptance Criteria

1. THE Storage_Provider SHALL write Processed_Copies under the Storage_Root located outside any directory from which the web server executes application code.
2. WHERE images are served from the local filesystem, THE Storage_Provider SHALL serve them through a route that sets a non-executable content disposition and the verified image content type.
3. THE Storage_Provider SHALL serve stored image bytes with an `X-Content-Type-Options: nosniff` response header.
4. WHERE a cloud Storage_Provider is configured, THE Upload_Service SHALL store the Processed_Copy in the configured secure bucket instead of the local filesystem.

### Requirement 8b: Document deployment hardening

**User Story:** As a system operator, I want deployment guidance for the upload directory, so that the web server is configured to refuse script execution there.

#### Acceptance Criteria

1. THE feature SHALL provide documentation describing how to configure the deployment so that script execution is disabled within the image storage directory.

### Requirement 9: Thumbnail generation

**User Story:** As an Administrator, I want thumbnails generated for uploaded images, so that the dashboard can display previews efficiently.

#### Acceptance Criteria

1. WHEN a Processed_Copy is persisted, THE Image_Processor SHALL generate a Thumbnail derived only from the Processed_Copy.
2. THE Image_Processor SHALL NOT derive a Thumbnail from the original uploaded bytes.
3. THE Image_Processor SHALL produce the Thumbnail in an Allowed_Format with all EXIF/Metadata removed.

### Requirement 10: Secure display and Content Security Policy

**User Story:** As a security engineer, I want images displayed only from trusted origins under a Content Security Policy, so that injected external image sources are blocked.

#### Acceptance Criteria

1. THE application SHALL send a CSP response header that restricts the `img-src` directive to the application origin and configured secure storage origins.
2. WHEN the dashboard displays an image, THE dashboard SHALL load it from a URL returned by the Upload_Service for a Processed_Copy.
3. THE application SHALL send an `X-Content-Type-Options: nosniff` response header for application responses.

### Requirement 11: Successful upload response

**User Story:** As an Administrator, I want a clear response after a successful upload, so that the dashboard can store and display the processed image.

#### Acceptance Criteria

1. WHEN processing and persistence succeed, THE Upload_Service SHALL respond with a success payload containing the Processed_Copy URL, the Safe_Filename, the verified content type, the stored size, and the Thumbnail URL.
2. THE Upload_Service SHALL return the URL of the Processed_Copy and SHALL NOT return any URL referencing the original uploaded bytes.

### Requirement 12: Error handling and feedback

**User Story:** As an Administrator, I want clear errors when an upload is rejected, so that I understand why and can correct the file.

#### Acceptance Criteria

1. IF the Upload_Service rejects a request, THEN THE Upload_Service SHALL respond with a descriptive error message and the corresponding HTTP status code without persisting any file.
2. WHEN the Upload_Component receives a rejection, THE Upload_Component SHALL display the rejection reason to the Administrator.
3. IF processing fails after temporary bytes are written, THEN THE Upload_Service SHALL remove any partial output before responding.
