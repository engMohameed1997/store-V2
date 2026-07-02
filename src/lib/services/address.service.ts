import { db } from "@/lib/db";
import { Errors } from "@/lib/api/errors";
import type { CreateAddressInput, UpdateAddressInput } from "@/lib/validators/address";
import { toAddressDTO, toAddressDTOList } from "@/lib/dto/address.dto";

const MAX_ADDRESSES_PER_USER = 20;

export class AddressService {
  static async list(userId: string) {
    const addresses = await db.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return toAddressDTOList(addresses);
  }

  static async getById(id: string, userId: string) {
    const address = await db.address.findFirst({ where: { id, userId, deletedAt: null } });
    if (!address) throw Errors.notFound("Address");
    return toAddressDTO(address);
  }

  static async create(userId: string, input: CreateAddressInput) {
    const count = await db.address.count({ where: { userId, deletedAt: null } });
    if (count >= MAX_ADDRESSES_PER_USER) {
      throw Errors.badRequest(`Maximum of ${MAX_ADDRESSES_PER_USER} addresses allowed`);
    }

    if (input.isDefault) {
      await db.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await db.address.create({
      data: { ...input, userId },
    });
    return toAddressDTO(address);
  }

  static async update(id: string, userId: string, input: UpdateAddressInput) {
    const existing = await db.address.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) throw Errors.notFound("Address");

    if (input.isDefault) {
      await db.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const address = await db.address.update({ where: { id }, data: input });
    return toAddressDTO(address);
  }

  static async delete(id: string, userId: string) {
    const existing = await db.address.findFirst({ where: { id, userId, deletedAt: null } });
    if (!existing) throw Errors.notFound("Address");

    await db.address.update({
      where: { id },
      data: { deletedAt: new Date(), isDefault: false },
    });
  }
}
