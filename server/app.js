const Express = require('express');
const app = new Express();
const fs = require('fs');
const path = require('path');
const { createServer: createViteServer } = require('vite')

async function main() {

    const vite = await createViteServer({
        server: { middlewareMode: true }
    });
    app.use(vite.middlewares);

    app.use(async (req, res) => {
        const url = req.originalUrl
        try {
            // 1. Read index.html
            let template = fs.readFileSync(
                path.resolve(process.cwd(), 'index.html'),
                'utf-8'
            )

            // 2. Apply vite HTML transforms. This injects the vite HMR client, and
            //    also applies HTML transforms from Vite plugins, e.g. global preambles
            //    from @vitejs/plugin-react-refresh
            template = await vite.transformIndexHtml(url, template)


            // 3. Load the server entry. vite.ssrLoadModule automatically transforms
            //    your ESM source code to be usable in Node.js! There is no bundling
            //    required, and provides efficient invalidation similar to HMR.
            const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
            // 4. render the app HTML. This assumes entry-server.js's exported `render`
            //    function calls appropriate framework SSR APIs,
            //    e.g. ReactDOMServer.renderToString()
            const appHtml = await render(url)

            // 5. Inject the app-rendered HTML into the template.
            const html = template.replace(`<!--ssr-outlet-->`, appHtml)
            // 6. Send the rendered HTML back.
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
        } catch (e) {
            // If an error is caught, let vite fix the stracktrace so it maps back to
            // your actual source code.
            vite.ssrFixStacktrace(e)
            console.error(e)
            res.status(500).end(e.message)
        }

    });
    app.listen('3030')
}
main()

