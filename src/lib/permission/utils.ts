import { PERMISSIONS } from './permissions';

type PermissionKey = keyof typeof PERMISSIONS;
type PermissionValue = (typeof PERMISSIONS)[PermissionKey];
type CompressedPermissions = string;

const TOTAL_PERMISSIONS = Object.keys(PERMISSIONS).length;
const BYTE_LENGTH = Math.ceil(TOTAL_PERMISSIONS / 8);

const createPermissionBitMap = (): Record<PermissionKey, number> => {
  const entries = Object.keys(PERMISSIONS) as PermissionKey[];
  return entries.reduce<Record<PermissionKey, number>>(
    (acc, key, index) => ({ ...acc, [key]: index }),
    {} as Record<PermissionKey, number>,
  );
};

const createBitToPermissionMap = (): Record<number, PermissionKey> => {
  const entries = Object.keys(PERMISSIONS) as PermissionKey[];
  return entries.reduce<Record<number, PermissionKey>>(
    (acc, key, index) => ({ ...acc, [index]: key }),
    {} as Record<number, PermissionKey>,
  );
};

const PERMISSION_BIT_MAP = createPermissionBitMap();
const BIT_TO_PERMISSION_MAP = createBitToPermissionMap();

const getPermissionConstantKey = (permissionValue: string): PermissionKey | undefined => {
  return (Object.entries(PERMISSIONS) as [PermissionKey, string][]).find(([, value]) => value === permissionValue)?.[0];
};

const setBitInArray = (bitArray: Uint8Array, bitIndex: number): Uint8Array => {
  const newArray = new Uint8Array(bitArray);
  const byteIndex = Math.floor(bitIndex / 8);
  const bitOffset = bitIndex % 8;
  newArray[byteIndex] |= 1 << bitOffset;
  return newArray;
};

const isBitSetInArray = (bitArray: Uint8Array, bitIndex: number): boolean => {
  const byteIndex = Math.floor(bitIndex / 8);
  const bitOffset = bitIndex % 8;
  return !!(bitArray[byteIndex] & (1 << bitOffset));
};

const stringToUint8Array = (str: string): Uint8Array => {
  const array = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    array[i] = str.charCodeAt(i);
  }
  return array;
};

const uint8ArrayToBase64 = (array: Uint8Array): string => {
  return btoa(String.fromCharCode(...array));
};

const base64ToUint8Array = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  return stringToUint8Array(binaryString);
};

export const compressPermissions = (permissions: PermissionValue[]): CompressedPermissions => {
  const initialBitArray = new Uint8Array(BYTE_LENGTH);
  const compressedBitArray = permissions.reduce<Uint8Array>((bitArray, permission) => {
    const constantKey = getPermissionConstantKey(permission);
    if (!constantKey || PERMISSION_BIT_MAP[constantKey] === undefined) {
      console.warn(`Unknown permission: ${permission}`);
      return bitArray;
    }
    const bitIndex = PERMISSION_BIT_MAP[constantKey];
    return setBitInArray(bitArray, bitIndex);
  }, initialBitArray);
  return uint8ArrayToBase64(compressedBitArray);
};

export const decompressPermissions = (compressedData: CompressedPermissions): PermissionValue[] => {
  try {
    const bitArray = base64ToUint8Array(compressedData);
    const permissions: PermissionValue[] = [];
    for (let bitIndex = 0; bitIndex < TOTAL_PERMISSIONS; bitIndex++) {
      if (isBitSetInArray(bitArray, bitIndex)) {
        const constantKey = BIT_TO_PERMISSION_MAP[bitIndex];
        if (constantKey && PERMISSIONS[constantKey]) {
          permissions.push(PERMISSIONS[constantKey]);
        }
      }
    }
    return permissions;
  } catch (error) {
    console.error('Failed to decompress permissions:', error);
    return [];
  }
};

export const createPermissionChecker = (compressedPermissions: CompressedPermissions) => {
  let bitArray: Uint8Array | null = null;
  const getBitArray = (): Uint8Array => {
    if (!bitArray) {
      try {
        bitArray = base64ToUint8Array(compressedPermissions);
      } catch {
        bitArray = new Uint8Array(BYTE_LENGTH);
      }
    }
    return bitArray;
  };

  const hasPermissionByKey = (permissionKey: PermissionKey): boolean => {
    const bitIndex = PERMISSION_BIT_MAP[permissionKey];
    if (bitIndex === undefined) return false;
    return isBitSetInArray(getBitArray(), bitIndex);
  };

  const hasPermissionByValue = (permissionValue: PermissionValue): boolean => {
    const constantKey = getPermissionConstantKey(permissionValue);
    return constantKey ? hasPermissionByKey(constantKey) : false;
  };

  const hasAnyPermissionByKeys = (permissionKeys: PermissionKey[]): boolean => permissionKeys.some(hasPermissionByKey);
  const hasAnyPermissionByValues = (permissionValues: PermissionValue[]): boolean =>
    permissionValues.some(hasPermissionByValue);
  const hasAllPermissionsByKeys = (permissionKeys: PermissionKey[]): boolean =>
    permissionKeys.every(hasPermissionByKey);
  const hasAllPermissionsByValues = (permissionValues: PermissionValue[]): boolean =>
    permissionValues.every(hasPermissionByValue);
  const getAllPermissions = (): PermissionValue[] => decompressPermissions(compressedPermissions);
  const getPermissionCount = (): number => {
    const bits = getBitArray();
    let count = 0;
    for (let bitIndex = 0; bitIndex < TOTAL_PERMISSIONS; bitIndex++) {
      if (isBitSetInArray(bits, bitIndex)) count++;
    }
    return count;
  };

  return {
    hasPermissionByKey,
    hasPermissionByValue,
    hasAnyPermissionByKeys,
    hasAnyPermissionByValues,
    hasAllPermissionsByKeys,
    hasAllPermissionsByValues,
    getAllPermissions,
    getPermissionCount,
  } as const;
};

export const getPermissionValue = (key: PermissionKey): PermissionValue => PERMISSIONS[key];
export const getPermissionKey = (value: PermissionValue): PermissionKey | undefined => getPermissionConstantKey(value);
export const getAllPermissionKeys = (): PermissionKey[] => Object.keys(PERMISSIONS) as PermissionKey[];
export const getAllPermissionValues = (): PermissionValue[] => Object.values(PERMISSIONS);
export const isValidPermissionKey = (key: string): key is PermissionKey => key in PERMISSIONS;
export const isValidPermissionValue = (value: string): value is PermissionValue =>
  Object.values(PERMISSIONS).includes(value as PermissionValue);

export type { PermissionKey, PermissionValue, CompressedPermissions };
export type PermissionChecker = ReturnType<typeof createPermissionChecker>;
