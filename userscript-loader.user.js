// ==UserScript==
// @name        tinygrail-compat loader
// @namespace   tinygrail-compat
// @author      mtcode
// @version     1.0.0
// @include     http*://bgm.tv/*
// @include     http*://bangumi.tv/*
// @include     http*://chii.in/*
// @grant       none
// ==/UserScript==

(function () {
  "use strict";

  const remoteScriptUrl =
    "https://cdn.jsdelivr.net/gh/koorinyaa/tinygrail-compat@master/userscript.user.js";

  /**
   * 异步执行任务
   *
   * @param {Function} task - 需要执行的任务
   * @returns {void}
   */
  function runSoon(task) {
    if ("queueMicrotask" in window) {
      window.queueMicrotask(task);
      return;
    }

    if (window.Promise) {
      window.Promise.resolve().then(task);
      return;
    }

    window.setTimeout(task, 0);
  }

  /**
   * 在浏览器空闲时执行后台任务
   *
   * @param {Function} task - 需要执行的任务
   * @returns {void}
   */
  function runWhenIdle(task) {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(task, { timeout: 10000 });
      return;
    }

    window.setTimeout(task, 0);
  }

  /**
   * 刷新远程脚本的浏览器缓存
   *
   * @returns {void}
   */
  function refreshRemoteScriptCache() {
    if (!window.fetch) return;

    runWhenIdle(() => {
      window
        .fetch(remoteScriptUrl, {
          method: "GET",
          cache: "reload",
          mode: "cors",
          credentials: "omit",
        })
        .catch(() => {});
    });
  }

  /**
   * 异步加载并执行远程脚本
   *
   * @returns {void}
   */
  function loadRemoteScript() {
    const script = document.createElement("script");

    script.src = remoteScriptUrl;
    script.async = true;
    script.crossOrigin = "anonymous";

    script.addEventListener("load", () => {
      // 远程脚本加载完成后，再后台刷新缓存
      refreshRemoteScriptCache();
    });

    script.addEventListener("error", () => {
      script.remove();
    });

    (document.head || document.documentElement).appendChild(script);
  }

  runSoon(loadRemoteScript);
})();
