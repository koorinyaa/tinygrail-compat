// ==UserScript==
// @name        tinygrail-compat
// @author      mtcode
// @include     http*://bgm.tv/*
// @include     http*://bangumi.tv/*
// @include     http*://chii.in/*
// ==/UserScript==
(function () {
  "use strict";

  const pathName = window.location.pathname;

  // 按钮样式常量
  const BUTTON_CLASS =
    "whitespace-nowrap font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-xs rounded-md bgm-bg text-white font-semibold shadow-sm hover:opacity-90";

  // 等待元素出现并执行回调
  const waitForElement = (selector, callback, continuous = false) => {
    const observer = new MutationObserver(() => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        callback(elements);
        if (!continuous) observer.disconnect();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // 如果元素已存在，立即执行
    const elements = document.querySelectorAll(selector);
    if (elements.length > 0) {
      callback(elements);
      if (!continuous) observer.disconnect();
    }
  };

  // 添加按钮
  const addButton = (containerSelector, buttonId, buttonText, onClick) => {
    const $container = $(containerSelector);
    if ($container.find(`#${buttonId}`).length > 0) return;

    const $button = $(
      `<button id="${buttonId}" class="${BUTTON_CLASS}">${buttonText}</button>`,
    );
    $button.on("click", onClick);
    $container.append($button);
  };

  // 为所有匹配的容器添加按钮
  const addButtonToAll = (
    containerSelector,
    buttonClass,
    buttonText,
    onClick,
  ) => {
    $(containerSelector).each(function () {
      const $container = $(this);
      if ($container.find(`.${buttonClass}`).length > 0) return;

      const $button = $(
        `<button class="${buttonClass} ${BUTTON_CLASS}">${buttonText}</button>`,
      );
      $button.on("click", onClick);
      $container.append($button);
    });
  };

  if (pathName.startsWith("/rakuen/home")) {
  }
})();
