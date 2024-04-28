export type Fetch = (req: Request) => Promise<Response> | Response

export const defineFramework = async (listen: () => Promise<Fetch>) => {
  return await listen()
}
