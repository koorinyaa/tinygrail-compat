// ==UserScript==
// @name        tinygrail-compat
// @namespace   tinygrail-compat
// @author      mtcode
// @version     1.0.0
// @include     http*://bgm.tv/*
// @include     http*://bangumi.tv/*
// @include     http*://chii.in/*
// ==/UserScript==
(function () {
  "use strict";

  const pathName = window.location.pathname;

  /**
   * 等待元素出现并执行回调
   * @param {string} selector - CSS选择器
   * @param {Function} callback - 元素出现时的回调函数
   * @param {boolean} continuous - 是否持续监听（默认false）
   */
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

  /**
   * 查找单个容器并执行回调
   * @param {string} containerSelector - 容器选择器
   * @param {Function} callback - 回调函数，接收jQuery对象作为参数
   * @returns {boolean} 是否找到容器
   */
  const addElement = (containerSelector, callback) => {
    const $container = $(containerSelector);
    if ($container.length === 0) return false;
    callback($container);
    return true;
  };

  /**
   * 查找所有匹配的容器并执行回调
   * @param {string} containerSelector - 容器选择器
   * @param {Function} callback - 回调函数，接收jQuery对象作为参数
   * @returns {number} 处理的容器数量
   */
  const addElementToAll = (containerSelector, callback) => {
    let count = 0;
    $(containerSelector).each(function () {
      callback($(this));
      count++;
    });
    return count;
  };

  /**
   * 获取完整的请求URL
   * @param {string} url - 相对URL
   * @returns {string} 完整URL
   */
  const getFullURL = (url) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    return "https://tinygrail.com/api/" + url;
  };

  /**
   * GET请求
   * @param {string} url - 请求地址
   * @param {object} data - 请求参数
   * @param {object} options - 其他选项
   * @returns {Promise}
   */
  const get = (url, data = {}, options = {}) => {
    return $.ajax({
      url: getFullURL(url),
      type: "GET",
      data,
      dataType: "json",
      xhrFields: { withCredentials: true },
      ...options,
    });
  };

  /**
   * POST请求
   * @param {string} url - 请求地址
   * @param {object} data - 请求数据
   * @param {object} options - 其他选项
   * @returns {Promise}
   */
  const post = (url, data = {}, options = {}) => {
    return $.ajax({
      url: getFullURL(url),
      type: "POST",
      data: JSON.stringify(data),
      contentType: "application/json",
      dataType: "json",
      xhrFields: { withCredentials: true },
      ...options,
    });
  };

  // 为圣殿添加修改塔图和复制塔图的按钮
  if (
    pathName.startsWith("/rakuen/home") ||
    pathName.startsWith("/rakuen/topic/crt/") ||
    pathName.startsWith("/character") ||
    pathName.startsWith("/user")
  ) {
    waitForElement(
      "#tg-temple-detail #tg-temple-actions",
      () => {
        // 从浏览器缓存获取用户信息
        const userAssetsStr = localStorage.getItem("tinygrail:user-assets");
        if (!userAssetsStr) return;

        const userAssets = JSON.parse(userAssetsStr);
        const currentUserId = userAssets.id;

        // 为每个圣殿的actions添加按钮
        addElementToAll("#tg-temple-detail #tg-temple-actions", ($actions) => {
          // 检查按钮是否已存在
          if ($actions.find("#tgc-temple-edit-btn").length > 0) return;

          // 获取父级temple的data-user-id
          const $temple = $actions.closest("#tg-temple-detail");
          const templeUserId = parseInt($temple.attr("data-user-id"));
          const charaId = parseInt($temple.attr("data-character-id"));

          // 如果用户ID一致或为0，不添加按钮
          if (
            !templeUserId ||
            templeUserId === 0 ||
            templeUserId === currentUserId
          )
            return;

          const buttonClass =
            "whitespace-nowrap font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 text-xs rounded-md bgm-color border border-current hover:bgm-bg hover:border-transparent hover:text-white";

          // 创建修改按钮
          const $editBtn = $(
            `<button id="tgc-temple-edit-btn" class="${buttonClass}" title="修改圣殿封面">修改</button>`,
          );

          // 修改按钮点击事件
          $editBtn.on("click", () => {
            const cover = prompt("图片url(你可以复制已有圣殿图片的url)：");
            if (!cover) return;

            const url =
              "https://tinygrail.oss-cn-hangzhou.aliyuncs.com/" +
              cover.match(/cover\/\S+\.jpg/)[0];

            post(`chara/temple/cover/${charaId}/${templeUserId}`, url).then(
              (d) => {
                if (d.State === 0) {
                  alert("更换封面成功。");

                  // 更新圣殿详情中的封面图片
                  $("#tg-temple-detail").each(function () {
                    const $detail = $(this);
                    const detailUserId = parseInt($detail.attr("data-user-id"));
                    const detailCharaId = parseInt(
                      $detail.attr("data-character-id"),
                    );

                    if (
                      detailUserId === templeUserId &&
                      detailCharaId === charaId
                    ) {
                      const $img = $detail.find("#tg-temple-image img");
                      const $templeImage = $detail.find("#tg-temple-image");

                      // 移除原有的onload事件
                      $img.off("load");
                      $img[0].onload = null;

                      // 图片加载完成后更新尺寸
                      $img.on("load", function () {
                        const MIN_WIDTH = 480;
                        const naturalWidth = this.naturalWidth;
                        const finalWidth = Math.max(naturalWidth, MIN_WIDTH);

                        // 设置圣殿图片容器样式
                        $templeImage.css({
                          width: `${finalWidth}px`,
                          maxWidth: "100%",
                        });

                        // 设置图片和圣殿详情宽度
                        $img.css("width", `${finalWidth}px`);
                        $detail.css("width", `${finalWidth}px`);
                      });

                      // 更新图片源
                      $img.attr("src", cover);
                    }
                  });
                } else {
                  alert(d.Message);
                }
              },
            );
          });

          // 创建复制按钮
          const $copyBtn = $(
            `<button id="tgc-temple-copy-btn" class="${buttonClass}" title="复制圣殿图片为自己圣殿的封面">复制</button>`,
          );

          // 复制按钮点击事件
          $copyBtn.on("click", () => {
            const cover = $temple.find("#tg-temple-image img").attr("src");
            if (!cover) {
              alert("未找到封面图片");
              return;
            }

            const url =
              "https://tinygrail.oss-cn-hangzhou.aliyuncs.com/" +
              cover.match(/cover\/\S+\.jpg/)[0];

            post(`chara/temple/cover/${charaId}`, url).then((d) => {
              if (d.State === 0) {
                alert("复制封面成功。");
              } else {
                alert(d.Message);
              }
            });
          });

          // 添加按钮到容器
          $actions.addClass("p-4 pt-2").append($editBtn).append($copyBtn);
        });
      },
      true,
    );
  }

  // 正在请求的标记和等待更新的元素
  const issuePriceRequestingKeys = new Map();

  // 添加发行价
  if (
    pathName.startsWith("/rakuen/home") ||
    pathName.startsWith("/rakuen/topic/crt/") ||
    pathName.startsWith("/character") ||
    pathName.startsWith("/user")
  ) {
    waitForElement(
      "#tg-character-box #tg-trade-box-header-details-info",
      () => {
        addElementToAll(
          "#tg-character-box #tg-trade-box-header-details-info",
          ($chips) => {
            // 检查是否已存在
            if ($chips.find("#tgc-issue-price").length > 0) return;

            const $characterBox = $chips.closest("#tg-character-box");
            const characterId = $characterBox.attr("data-character-id");
            const $listedDate = $chips.find("#listed-date");

            const listedDateFull = $listedDate.attr("data-listed-date");
            const listedDate = listedDateFull
              ? listedDateFull.split("T")[0]
              : null;

            const $issuePrice = $(
              '<span id="tgc-issue-price" class="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800">发行价：--</span>',
            );
            const $gensokyo = $chips.find("#gensokyo");
            if ($gensokyo.length > 0) {
              $gensokyo.after($issuePrice);
            } else {
              $chips.append($issuePrice);
            }

            if (characterId && listedDate) {
              const cacheKey = `${characterId}_${listedDate}`;

              // 从 localStorage 读取缓存对象
              const cacheStr = localStorage.getItem("tgc:issue-price-cache");
              const cache = cacheStr ? JSON.parse(cacheStr) : {};

              // 检查缓存
              if (cache[cacheKey]) {
                $issuePrice.text(`发行价：₵${cache[cacheKey]}`);
                return;
              }

              // 检查是否正在请求
              if (issuePriceRequestingKeys.has(cacheKey)) {
                // 将当前元素加入等待列表
                issuePriceRequestingKeys.get(cacheKey).push($issuePrice);
                return;
              }

              // 创建等待列表并标记为正在请求
              issuePriceRequestingKeys.set(cacheKey, [$issuePrice]);

              get(`chara/charts/${characterId}/${listedDate}`)
                .then((d) => {
                  if (d.State === 0 && d.Value && d.Value.length > 0) {
                    const firstData = d.Value[0];
                    const issuePrice =
                      firstData.Amount > 0
                        ? (firstData.Price / firstData.Amount).toFixed(2)
                        : "0.00";

                    // 保存到缓存对象
                    cache[cacheKey] = issuePrice;
                    localStorage.setItem(
                      "tgc:issue-price-cache",
                      JSON.stringify(cache),
                    );

                    // 更新所有等待的元素
                    const waitingElements =
                      issuePriceRequestingKeys.get(cacheKey);
                    waitingElements.forEach(($element) => {
                      $element.text(`发行价：₵${issuePrice}`);
                    });
                  }
                })
                .finally(() => {
                  // 请求完成后移除标记
                  issuePriceRequestingKeys.delete(cacheKey);
                });
            }
          },
        );
      },
      true,
    );
  }

  // 添加助手关注竞拍按钮
  if (
    pathName.startsWith("/rakuen/home") ||
    pathName.startsWith("/rakuen/topic/crt/") ||
    pathName.startsWith("/character") ||
    pathName.startsWith("/user")
  ) {
    waitForElement(
      "#tg-character-box #tg-trade-box-header-actions",
      () => {
        addElementToAll(
          "#tg-character-box #tg-trade-box-header-actions",
          ($actions) => {
            // 检查是否已存在
            if ($actions.find("#tgc-btn-follow-auction").length > 0) return;

            const $characterBox = $actions.closest("#tg-character-box");
            const characterId = parseInt(
              $characterBox.attr("data-character-id"),
            );

            // 获取关注列表的辅助函数
            const getFollowList = () => {
              const followListStr = localStorage.getItem(
                "TinyGrail_Helper_followList",
              );
              const followList = followListStr
                ? JSON.parse(followListStr)
                : { user: "", charas: [], auctions: [] };
              // 去重
              followList.auctions = [...new Set(followList.auctions)];
              return followList;
            };

            // 检查是否已关注
            const followList = getFollowList();
            const isFollowed = followList.auctions.includes(characterId);
            const buttonText = isFollowed ? "取消关注" : "关注竞拍";

            const $followAuctionBtn = $(
              `<button class="btn-bgm btn btn-xs" id="tgc-btn-follow-auction">${buttonText}</button>`,
            );

            // 按钮点击事件
            $followAuctionBtn.on("click", () => {
              const followList = getFollowList();

              const index = followList.auctions.indexOf(characterId);
              if (index > -1) {
                // 已关注，执行取消关注
                followList.auctions.splice(index, 1);
                $followAuctionBtn.text("关注竞拍");
              } else {
                // 未关注，执行关注
                followList.auctions.push(characterId);
                $followAuctionBtn.text("取消关注");
              }

              // 保存到localStorage
              localStorage.setItem(
                "TinyGrail_Helper_followList",
                JSON.stringify(followList),
              );
            });

            const $tradeHistoryBtn = $actions.find("#tg-btn-trade-history");
            if ($tradeHistoryBtn.length > 0) {
              $tradeHistoryBtn.before($followAuctionBtn);
            } else {
              $actions.append($followAuctionBtn);
            }
          },
        );
      },
      true,
    );
  }
})();
