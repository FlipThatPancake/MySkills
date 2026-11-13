// @js:page — the default page: a full-window canvas. build.mjs bundles it with the scene.json as __SCENE__.
import { createScene } from './run.js';
createScene(document.getElementById('scene'), __SCENE__);
