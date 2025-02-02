import initApp from "./server";
const port = process.env.PORT;

console.log("app starting...");
initApp().then((app) => {
  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  });
});