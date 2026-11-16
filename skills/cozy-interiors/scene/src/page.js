// @js:page — the default page: a full-window canvas. build.mjs bundles it with the scene.json as __SCENE__ (an `areas` scene runs through area-run.js, a `plan` scene through run.js).
import { createScene } from './run.js';
import { createAreaScene } from './area-run.js';
const canvas = document.getElementById('scene');
(__SCENE__.areas ? createAreaScene : createScene)(canvas, __SCENE__);
