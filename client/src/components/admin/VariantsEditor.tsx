"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  createVariant,
  updateVariant,
  type AdminVariant,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";
import { formatGrind, formatSize } from "@/lib/format";
import { adminInput, centsToDollars, dollarsToCents, ErrorNote, td, th } from "./ui";

const GRINDS = ["whole_bean", "ground", "espresso", "filter"];

function VariantRow({
  productId,
  variant,
  onSaved,
}: {
  productId: string;
  variant: AdminVariant;
  onSaved: () => void;
}) {
  const { token } = useAuth();
  const [price, setPrice] = useState(centsToDollars(variant.priceCents));
  const [stock, setStock] = useState(String(variant.stock));
  const [active, setActive] = useState(variant.isActive);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  const priceCents = dollarsToCents(price);
  const stockNum = Number(stock);
  const stockValid = stock.trim() !== "" && Number.isInteger(stockNum) && stockNum >= 0;
  const changed =
    priceCents !== variant.priceCents || stockNum !== variant.stock || active !== variant.isActive;

  async function save() {
    if (!token) return;
    if (priceCents === null || !stockValid) {
      setMessage({ text: "Enter a valid price and stock", ok: false });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await updateVariant(token, productId, variant.id, { priceCents, stock: stockNum, isActive: active });
      setMessage({ text: "Saved", ok: true });
      onSaved();
    } catch (err) {
      setMessage({ text: err instanceof ApiError ? err.message : "Could not save", ok: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <tr className="border-t border-sand-dark">
      <td className={td}>
        <p className="font-medium text-forest">
          {formatSize(variant.sizeGrams)} · {formatGrind(variant.grind)}
        </p>
        <p className="text-xs">{variant.sku}</p>
      </td>
      <td className={td}>
        <input
          aria-label={`Price for ${variant.sku} in dollars`}
          inputMode="decimal"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className={`${adminInput} w-28`}
        />
      </td>
      <td className={td}>
        <input
          aria-label={`Stock for ${variant.sku}`}
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
          className={`${adminInput} w-24`}
        />
      </td>
      <td className={td}>
        <input
          type="checkbox"
          aria-label={`${variant.sku} is sold`}
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-5 w-5 accent-[#1f3b2d]"
        />
      </td>
      <td className={td}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            disabled={!changed || busy}
            onClick={save}
            className="rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream disabled:opacity-40"
          >
            {busy ? "..." : "Save"}
          </button>
          {message && (
            <span role={message.ok ? "status" : "alert"} className={`text-xs ${message.ok ? "text-forest-light" : "text-terracotta"}`}>
              {message.text}
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

export function VariantsEditor({
  productId,
  variants,
  onChanged,
}: {
  productId: string;
  variants: AdminVariant[];
  onChanged: () => void; // reload the product
}) {
  const { token } = useAuth();
  const [sku, setSku] = useState("");
  const [size, setSize] = useState("250");
  const [grind, setGrind] = useState("whole_bean");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    const sizeNum = Number(size);
    const stockNum = Number(stock);
    const priceCents = dollarsToCents(price);
    if (!sku.trim()) return setError("SKU is required");
    if (!Number.isInteger(sizeNum) || sizeNum < 1) return setError("Size must be a whole number of grams");
    if (priceCents === null) return setError("Enter a valid price, for example 18.50");
    if (!Number.isInteger(stockNum) || stockNum < 0) return setError("Stock must be 0 or more");

    setBusy(true);
    setError(null);
    try {
      await createVariant(token, productId, {
        sku: sku.trim(),
        sizeGrams: sizeNum,
        grind,
        priceCents,
        stock: stockNum,
        isActive: true,
      });
      setSku("");
      setPrice("");
      setStock("0");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not add the variant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {variants.length === 0 ? (
        <p className="rounded-2xl bg-sand px-5 py-4 text-sm">
          No sizes yet. Add at least one below, or customers will see this coffee as unavailable.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sand-dark bg-cream">
          <table className="w-full min-w-[560px]">
            <thead>
              <tr>
                <th className={th}>Variant</th>
                <th className={th}>Price ($)</th>
                <th className={th}>Stock</th>
                <th className={th}>Sold</th>
                <th className={th}></th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v) => (
                <VariantRow key={`${v.id}-${v.priceCents}-${v.stock}-${v.isActive}`} productId={productId} variant={v} onSaved={onChanged} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form onSubmit={add} noValidate className="rounded-2xl border border-sand-dark bg-cream p-5">
        <h3 className="mb-4 text-lg font-semibold">Add a variant</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <input aria-label="SKU" placeholder="SKU (YRG-250-WB)" value={sku} onChange={(e) => setSku(e.target.value)} className={adminInput} />
          <input aria-label="Size in grams" placeholder="Size (g)" inputMode="numeric" value={size} onChange={(e) => setSize(e.target.value)} className={adminInput} />
          <select aria-label="Grind" value={grind} onChange={(e) => setGrind(e.target.value)} className={adminInput}>
            {GRINDS.map((g) => (
              <option key={g} value={g}>
                {formatGrind(g)}
              </option>
            ))}
          </select>
          <input aria-label="Price in dollars" placeholder="Price ($)" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={adminInput} />
          <input aria-label="Stock" placeholder="Stock" inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className={adminInput} />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <button type="submit" disabled={busy} className="flex items-center gap-2 rounded-full bg-forest px-5 py-2.5 text-sm font-semibold text-cream disabled:opacity-50">
            <Plus size={16} aria-hidden="true" />
            {busy ? "Adding..." : "Add variant"}
          </button>
          <ErrorNote message={error} />
        </div>
      </form>
    </div>
  );
}
