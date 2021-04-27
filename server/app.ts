import Koa from "koa";
import koaRouter from "koa-router";
import cors from "@koa/cors";
import views from "koa-views";
import path from "path";
import koaStatic from "koa-static";

const router = new koaRouter();
const app = new Koa();
const port = 3000;
const render = views(path.join(__dirname, "../example"));

app.use(koaStatic("."));
app.use(render);
app.use(
  cors({
    allowMethods: "GET,HEAD,PUT,POST,DELETE,PATCH"
  })
);

router.post("/reportUrl", async (ctx) => {
  ctx.body = "success";
});

router.get("/404", async (ctx) => {
  ctx.status = 404;
});

router.get("/500", async (ctx) => {
  ctx.status = 500;
});

router.get("/timeout", async () => {
  await sleep(50000);
});

router.get("/success", async (ctx) => {
  ctx.body = "success";
});

router.get("/", async (ctx) => {
  await (ctx as any).render("index");
});

async function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, seconds);
  });
}

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(port);
console.log(`Server is now listening on port ${port}`);
