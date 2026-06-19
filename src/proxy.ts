import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** 旧 URL `/quiz/:unitId` をクエリ形式へリダイレクト */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/quiz/")) {
    return NextResponse.next();
  }

  const unitId = pathname.slice("/quiz/".length);
  if (!unitId) {
    return NextResponse.next();
  }

  // 旧「縄文・弥生」統合単元 → サブメニューへ
  if (unitId === "history-jomon-yayoi") {
    const url = request.nextUrl.clone();
    url.pathname = "/topics/history/jomon-yayoi";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (unitId === "history-kofun-asuka") {
    const url = request.nextUrl.clone();
    url.pathname = "/topics/history/kofun-asuka";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (unitId === "history-nara-heian") {
    const url = request.nextUrl.clone();
    url.pathname = "/topics/history/nara-heian";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (unitId === "history-muromachi-sengoku") {
    const url = request.nextUrl.clone();
    url.pathname = "/topics/history/muromachi-sengoku";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (unitId === "history-meiji-taisho") {
    const url = request.nextUrl.clone();
    url.pathname = "/topics/history/meiji-taisho";
    url.search = "";
    return NextResponse.redirect(url);
  }

  const url = request.nextUrl.clone();
  url.pathname = "/quiz";
  url.searchParams.set("unitId", decodeURIComponent(unitId));
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/quiz/:unitId+"],
};
