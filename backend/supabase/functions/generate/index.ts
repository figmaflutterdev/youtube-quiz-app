export default async function handler(req: Request) {
  return new Response(
    JSON.stringify({ message: "Hello from generate!" }),
    { headers: { "Content-Type": "application/json" } }
  )
}