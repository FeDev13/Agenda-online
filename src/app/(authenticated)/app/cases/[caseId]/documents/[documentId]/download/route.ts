import { NextResponse } from "next/server";

import { createSignedDocumentDownloadUrl } from "@/lib/server/case-detail";
import { UserFacingError } from "@/lib/server/errors";

export async function GET(
  _request: Request,
  {
    params
  }: {
    params: Promise<{ caseId: string; documentId: string }>;
  }
) {
  const { caseId, documentId } = await params;

  try {
    const signedUrl = await createSignedDocumentDownloadUrl(caseId, documentId);
    return NextResponse.redirect(signedUrl);
  } catch (error) {
    if (error instanceof UserFacingError) {
      return new NextResponse("Document unavailable.", { status: 404 });
    }

    throw error;
  }
}
