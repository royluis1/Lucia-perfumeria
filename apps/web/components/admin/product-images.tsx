'use client';

import { useEffect, useRef, useState } from 'react';
import { deleteProductImage, reorderProductImages, uploadProductImage } from '../../lib/admin';
import type { AdminProductImage } from '../../lib/admin';
import { resolveImageUrl } from '../../lib/api';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, TrashIcon } from '../icons';
import { SmartImage } from '../smart-image';

export const MAX_PRODUCT_IMAGES = 8;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPT_ATTR = '.jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp';

type UploadTask = { key: string; name: string; percent: number };

type ProductImagesManagerProps = {
  productId: string;
  initialImages: AdminProductImage[];
  onChange: (images: AdminProductImage[]) => void;
  onError: (message: string) => void;
  onMessage: (message: string) => void;
};

export function ProductImagesManager({
  productId,
  initialImages,
  onChange,
  onError,
  onMessage,
}: ProductImagesManagerProps) {
  const [images, setImages] = useState<AdminProductImage[]>(initialImages);
  const [uploads, setUploads] = useState<UploadTask[]>([]);
  const [busy, setBusy] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const uploadKey = useRef(0);

  useEffect(() => {
    setImages(initialImages);
  }, [initialImages]);

  function applyImages(next: AdminProductImage[]) {
    setImages(next);
    onChange(next);
  }

  function validate(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) return `${file.name}: solo se aceptan JPG, PNG o WebP.`;
    if (file.size > MAX_SIZE_BYTES) return `${file.name}: supera los 5 MB.`;
    return null;
  }

  async function handleFiles(files: FileList | File[]) {
    if (busy) return;
    const list = Array.from(files);
    if (list.length === 0) return;

    const room = MAX_PRODUCT_IMAGES - images.length;
    if (room <= 0) {
      onError(`Este producto ya tiene el máximo de ${MAX_PRODUCT_IMAGES} fotos.`);
      return;
    }
    if (list.length > room) {
      onMessage(`Solo se subirán ${room} foto(s): el máximo es ${MAX_PRODUCT_IMAGES} por producto.`);
    }

    setBusy(true);
    let current = images;
    for (const file of list.slice(0, room)) {
      const problem = validate(file);
      if (problem) {
        onError(problem);
        continue;
      }
      const key = `upload-${uploadKey.current++}`;
      setUploads((previous) => [...previous, { key, name: file.name, percent: 0 }]);
      try {
        const image = await uploadProductImage(productId, file, (percent) => {
          setUploads((previous) =>
            previous.map((task) => (task.key === key ? { ...task, percent } : task)),
          );
        });
        current = [...current, image];
        applyImages(current);
      } catch (uploadError) {
        onError(uploadError instanceof Error ? uploadError.message : `No se pudo subir ${file.name}.`);
      } finally {
        setUploads((previous) => previous.filter((task) => task.key !== key));
      }
    }
    setBusy(false);
    onMessage('Fotos guardadas. La primera es la principal.');
  }

  async function persistOrder(next: AdminProductImage[]) {
    const previous = images;
    applyImages(next);
    setReordering(true);
    try {
      const ordered = await reorderProductImages(productId, next.map((image) => image.id));
      applyImages(ordered);
      onMessage('Orden de fotos actualizado.');
    } catch (orderError) {
      applyImages(previous);
      onError(orderError instanceof Error ? orderError.message : 'No se pudo reordenar las fotos.');
    } finally {
      setReordering(false);
    }
  }

  function makeMain(imageId: string) {
    if (reordering) return;
    const target = images.find((image) => image.id === imageId);
    if (!target || images[0]?.id === imageId) return;
    const next = [target, ...images.filter((image) => image.id !== imageId)];
    void persistOrder(next.map((image, index) => ({ ...image, position: index })));
  }

  function move(index: number, step: number) {
    const target = index + step;
    if (reordering || target < 0 || target >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    void persistOrder(next.map((image, itemIndex) => ({ ...image, position: itemIndex })));
  }

  function dropAt(index: number) {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      return;
    }
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    setDragIndex(null);
    void persistOrder(next.map((image, itemIndex) => ({ ...image, position: itemIndex })));
  }

  async function remove(imageId: string) {
    if (busy || reordering) return;
    if (!window.confirm('¿Borrar esta foto? Esta acción no se puede deshacer.')) return;
    try {
      const result = await deleteProductImage(productId, imageId);
      applyImages(result.images);
      onMessage('Foto eliminada.');
    } catch (deleteError) {
      onError(deleteError instanceof Error ? deleteError.message : 'No se pudo borrar la foto.');
    }
  }

  const full = images.length >= MAX_PRODUCT_IMAGES;

  return (
    <div className="border border-line bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[11px] font-extrabold uppercase tracking-[0.22em]">Fotos del producto</h2>
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          {images.length} / {MAX_PRODUCT_IMAGES}
        </span>
      </div>

      <label
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed px-4 py-6 text-center transition-colors ${
          dragOver ? 'border-black bg-black/[0.04]' : 'border-black/30 hover:border-black'
        } ${full || busy ? 'pointer-events-none opacity-50' : ''}`}
        onDragLeave={() => setDragOver(false)}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files.length > 0) void handleFiles(event.dataTransfer.files);
        }}
      >
        <input
          accept={ACCEPT_ATTR}
          className="sr-only"
          disabled={full || busy}
          multiple
          onChange={(event) => {
            if (event.target.files) void handleFiles(event.target.files);
            event.target.value = '';
          }}
          type="file"
        />
        <PlusIcon className="h-5 w-5" />
        <span className="text-xs font-semibold uppercase tracking-[0.18em]">
          {full ? 'Máximo alcanzado' : 'Subir fotos'}
        </span>
        <span className="text-xs text-muted">JPG, PNG o WebP · hasta 5 MB · la primera es la principal</span>
      </label>

      {uploads.length > 0 && (
        <ul className="mt-4 space-y-2">
          {uploads.map((task) => (
            <li key={task.key} className="text-xs text-muted">
              <div className="flex justify-between gap-3">
                <span className="truncate">{task.name}</span>
                <span>{task.percent}%</span>
              </div>
              <div className="mt-1 h-1 w-full bg-sand">
                <div className="h-1 bg-black transition-[width] duration-150" style={{ width: `${task.percent}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}

      {images.length === 0 ? (
        <p className="mt-4 text-xs text-muted">
          Todavía no hay fotos. Subí al menos una antes de publicar el producto.
        </p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              draggable={!reordering}
              key={image.id}
              onDragEnd={() => setDragIndex(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDragIndex(index)}
              onDrop={() => dropAt(index)}
              className={`group relative aspect-[4/5] overflow-hidden border bg-sand ${
                dragIndex === index ? 'border-black opacity-60' : 'border-line'
              }`}
            >
              <SmartImage
                alt={image.alt ?? ''}
                className="object-cover"
                sizes="(min-width: 640px) 20vw, 45vw"
                src={resolveImageUrl(image.url) ?? image.url}
              />
              {index === 0 && (
                <span className="absolute left-2 top-2 border border-black bg-black px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white">
                  Principal
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-white/90 px-1.5 py-1 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    aria-label="Mover a la izquierda"
                    className="border border-line p-1 transition-colors hover:border-black disabled:opacity-30"
                    disabled={index === 0 || reordering}
                    onClick={() => move(index, -1)}
                    type="button"
                  >
                    <ChevronLeftIcon className="h-3.5 w-3.5" />
                  </button>
                  <button
                    aria-label="Mover a la derecha"
                    className="border border-line p-1 transition-colors hover:border-black disabled:opacity-30"
                    disabled={index === images.length - 1 || reordering}
                    onClick={() => move(index, 1)}
                    type="button"
                  >
                    <ChevronRightIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  aria-label="Borrar foto"
                  className="border border-red-700/30 p-1 text-red-700 transition-colors hover:bg-red-50"
                  onClick={() => void remove(image.id)}
                  type="button"
                >
                  <TrashIcon className="h-3.5 w-3.5" />
                </button>
              </div>
              {index !== 0 && (
                <button
                  className="absolute right-2 top-2 border border-line bg-white/90 px-1.5 py-0.5 text-[10px] font-extrabold uppercase tracking-[0.12em] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                  onClick={() => makeMain(image.id)}
                  type="button"
                >
                  Hacer principal
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
