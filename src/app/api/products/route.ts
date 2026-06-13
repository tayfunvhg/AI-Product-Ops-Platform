import { NextRequest, NextResponse } from "next/server";
import { getActiveProductId, setActiveProductId, listProducts } from "@/lib/repo";

export const dynamic = "force-dynamic";

/** Products + active product selection (stored in data/settings.json). */
export async function GET() {
  return NextResponse.json({ ok: true, products: listProducts(), active: getActiveProductId() });
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON" }, { status: 400 });
  }
  const id = body?.id;
  if (!listProducts().some((p) => p.id === id)) {
    return NextResponse.json({ ok: false, error: "Неизвестный продукт" }, { status: 400 });
  }
  setActiveProductId(id);
  return NextResponse.json({ ok: true, active: id });
}
