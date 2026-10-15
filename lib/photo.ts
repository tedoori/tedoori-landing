import { MAX_PHOTOS } from "./quote";

// 견적 신청·수정 화면이 함께 쓰는 사진·전화번호 도우미

export const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_ACCEPT = PHOTO_TYPES.join(",");
export const MAX_PHOTO_MB = 10;

/** 고른 파일 중 올릴 수 있는 것만 남기고, 걸러진 이유를 알려줌 */
export function checkPhotos(files: File[], room: number) {
  let error = "";
  const ok: File[] = [];
  for (const f of files) {
    if (!(PHOTO_TYPES as readonly string[]).includes(f.type)) error = "JPG·PNG·WebP 사진만 올릴 수 있어요.";
    else if (f.size > MAX_PHOTO_MB * 1024 * 1024) error = `사진 한 장은 ${MAX_PHOTO_MB}MB까지 올릴 수 있어요.`;
    else ok.push(f);
  }
  if (ok.length > room) {
    error = `사진은 ${MAX_PHOTOS}장까지 올릴 수 있어요.`;
    ok.length = Math.max(0, room);
  }
  return { ok, error };
}

// 사진을 긴 변 2000px 이하 JPEG로 줄여서 올림
export async function shrinkPhoto(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode"))), "image/jpeg", 0.85),
  );
}

export const PHONE_RE = /^01[016789]\d{7,8}$/;

// 숫자만 남기고 010-0000-0000 모양으로
export const formatPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, d.length - 4)}-${d.slice(-4)}`;
};
