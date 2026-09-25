/* =================================================================
 *  Portfolio — フロントのちょっとした動き（ビルド不要のプレーンJS）
 *  各ページに共通で読み込まれ、必要な部分だけ動きます。
 * ================================================================= */
(() => {
  "use strict";

  /* ---- フッターの年号を自動更新 ---- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---- Works：カテゴリ絞り込み ---- */
  const tabs = document.getElementById("tabs");
  const grid = document.getElementById("works-grid");
  if (tabs && grid) {
    const cards = Array.from(grid.querySelectorAll(".card"));
    const empty = document.getElementById("works-empty");

    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;

      const filter = btn.dataset.filter;
      tabs
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.toggle("active", t === btn));

      let shown = 0;
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !match);
        if (match) shown += 1;
      });
      if (empty) empty.classList.toggle("is-hidden", shown > 0);
    });
  }

  /* ---- Contact：簡易バリデーション ---- */
  const form = document.getElementById("contact-form");
  if (form) {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const setError = (name, msg) => {
      const p = form.querySelector(`[data-error-for="${name}"]`);
      const input = form.querySelector(`#${name}`);
      if (p) {
        p.textContent = msg;
        p.classList.toggle("is-hidden", !msg);
      }
      if (input) input.style.borderColor = msg ? "var(--blush-deep)" : "";
    };

    form.addEventListener("submit", (e) => {
      const usingService = form.getAttribute("action"); // Formspree等を設定済みか
      const data = new FormData(form);
      const name = (data.get("name") || "").toString().trim();
      const email = (data.get("email") || "").toString().trim();
      const message = (data.get("message") || "").toString().trim();

      let ok = true;
      setError("name", name ? "" : "お名前をご入力ください");
      if (!name) ok = false;
      setError("email", emailRe.test(email) ? "" : "メールアドレスの形式をご確認ください");
      if (!emailRe.test(email)) ok = false;
      setError("message", message ? "" : "お問い合わせ内容をご入力ください");
      if (!message) ok = false;

      const banner = document.getElementById("form-error");

      if (!ok) {
        e.preventDefault();
        if (banner) banner.classList.remove("is-hidden");
        return;
      }
      if (banner) banner.classList.add("is-hidden");

      const thanks = document.getElementById("thanks");
      const showThanks = () => {
        form.classList.add("is-hidden");
        if (thanks) {
          thanks.classList.remove("is-hidden");
          thanks.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      };

      // 送信先が未設定なら、その場で完了メッセージだけ表示（実送信なし）
      if (!usingService) {
        e.preventDefault();
        showThanks();
        return;
      }

      // 送信先がある場合は、ページを移動せずその場で送信する
      e.preventDefault();
      const button = form.querySelector('button[type="submit"]');
      const label = button ? button.textContent : "";
      if (button) {
        button.disabled = true;
        button.textContent = "送信中…";
      }

      fetch(usingService, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      })
        .then((res) => {
          if (res.ok) {
            showThanks();
            return;
          }
          throw new Error("送信に失敗しました");
        })
        .catch(() => {
          if (banner) {
            banner.textContent =
              "送信できませんでした。通信環境をご確認のうえ、もう一度お試しください。何度も失敗する場合は naro.create@gmail.com までご連絡ください。";
            banner.classList.remove("is-hidden");
          }
        })
        .finally(() => {
          if (button) {
            button.disabled = false;
            button.textContent = label;
          }
        });
    });
  }

  /* ---- Works：動画カード（ホバーで再生 / クリックで拡大） ---- */
  const cardVideos = document.querySelectorAll(".card__media video");
  if (cardVideos.length) {
    const modal = document.getElementById("video-modal");
    const modalVideo = document.getElementById("modal-video");
    const modalClose = document.getElementById("modal-close");

    const closeModal = () => {
      if (!modal || !modalVideo) return;
      // ふわっと消してから隠す
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      window.setTimeout(() => {
        modal.hidden = true;
        modalVideo.pause();
        modalVideo.removeAttribute("src");
        modalVideo.load();
      }, 500);
    };

    cardVideos.forEach((video) => {
      const media = video.closest(".card__media");
      if (!media) return;
      media.classList.add("has-video");

      // 最初のフレームをサムネイル代わりに表示
      video.addEventListener("loadedmetadata", () => {
        try {
          video.currentTime = 0.05;
        } catch (e) {}
      });

      // マウスを乗せたら再生、離れたら停止
      media.addEventListener("mouseenter", () => {
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
      });
      media.addEventListener("mouseleave", () => {
        video.pause();
        try {
          video.currentTime = 0.05;
        } catch (e) {}
      });

      // クリックで拡大（操作ボタン付きモーダル・ふわっと表示）
      media.addEventListener("click", () => {
        if (!modal || !modalVideo) return;
        modalVideo.src = video.currentSrc || video.src;
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        // 次のフレームで .is-open を付けてフェードイン
        requestAnimationFrame(() => {
          requestAnimationFrame(() => modal.classList.add("is-open"));
        });
        const p = modalVideo.play();
        if (p && p.catch) p.catch(() => {});
      });
    });

    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }
})();
