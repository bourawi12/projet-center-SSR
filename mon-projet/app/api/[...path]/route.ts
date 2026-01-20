import { NextRequest, NextResponse } from "next/server"

const RAW_BACKEND_URL =
  process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"
const BACKEND_BASE_URL = RAW_BACKEND_URL.startsWith("http") ? RAW_BACKEND_URL : "http://localhost:8080"

export const dynamic = "force-dynamic"

async function proxy(request: NextRequest, pathParts: string[]) {
  const targetUrl = new URL(request.url)
  
  // IMPORTANT: Strip "api" from the path if it's the first part
  // Frontend calls /api/etudiants -> Backend expects /etudiants/
  const filteredParts = pathParts.filter(part => part !== "api")
  const path = filteredParts.length > 0 ? `/${filteredParts.join("/")}` : ""
  const backendUrl = `${BACKEND_BASE_URL}${path}${targetUrl.search}`

  console.log(`[PROXY] ${request.method} ${request.url} -> ${backendUrl}`)

  // Create headers for backend request
  const headers = new Headers()
  
  // CRITICAL: Preserve Authorization header for JWT authentication
  const authHeader = request.headers.get("authorization")
  if (authHeader) {
    console.log(`[PROXY] Forwarding auth header: ${authHeader.substring(0, 20)}...`)
    headers.set("Authorization", authHeader)
  } else {
    console.warn("[PROXY] No authorization header found in request")
  }
  
  // Preserve Content-Type for POST/PUT requests
  const contentType = request.headers.get("content-type")
  if (contentType) {
    headers.set("Content-Type", contentType)
  }
  
  // Add Accept header
  const acceptHeader = request.headers.get("accept")
  if (acceptHeader) {
    headers.set("Accept", acceptHeader)
  }

  // Add User-Agent
  headers.set("User-Agent", "Next.js API Proxy")

  const body =
    request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer()

  try {
    const response = await fetch(backendUrl, {
      method: request.method,
      headers,
      body,
      redirect: "manual",
    })

    console.log(`[PROXY] Backend responded with status: ${response.status}`)

    const responseHeaders = new Headers(response.headers)
    responseHeaders.delete("content-encoding")
    responseHeaders.delete("transfer-encoding")
    
    // Enable CORS for the frontend
    responseHeaders.set("Access-Control-Allow-Origin", "*")
    responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
    responseHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization")

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    })
  } catch (error) {
    console.error("[PROXY] Error:", error)
    return NextResponse.json(
      { error: "Failed to proxy request to backend" },
      { status: 502 }
    )
  }
}

export async function GET(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path || [])
}

export async function POST(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path || [])
}

export async function PUT(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path || [])
}

export async function PATCH(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path || [])
}

export async function DELETE(request: NextRequest, context: { params: { path: string[] } }) {
  return proxy(request, context.params.path || [])
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}