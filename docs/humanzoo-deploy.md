# HumanZoo status deployment

This fork keeps only public source code in Git.

Required Cloudflare Pages environment variables:

- `NezhaBaseUrl`: upstream Nezha dashboard origin, for example `https://status.example.com`
- `NezhaApiMode`: `v2`
- `DefaultLocale`: `zh`
- `NEXT_PUBLIC_NezhaFetchInterval`: `5000`
- `NEXT_PUBLIC_ShowFlag`: `true`
- `NEXT_PUBLIC_ShowTag`: `true`
- `NEXT_PUBLIC_CustomLogo`: public favicon URL
- `NEXT_PUBLIC_CustomTitle`: site title
- `NEXT_PUBLIC_Links`: `[]`

Do not commit passwords, JWT cookies, Cloudflare API tokens, SSH keys, or real
`.env.local` files. The Nezha v2 integration reads the public realtime
websocket snapshot through the server runtime, so this deployment does not need
a dashboard login token.
