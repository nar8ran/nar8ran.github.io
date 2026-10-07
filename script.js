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
    const catalog = document.getElementById("catalog-link");

    const applyFilter = (filter) => {
      tabs
        .querySelectorAll(".tab")
        .forEach((t) => t.classList.toggle("active", t.dataset.filter === filter));

      let shown = 0;
      cards.forEach((card) => {
        const match = filter === "all" || card.dataset.category === filter;
        card.classList.toggle("is-hidden", !match);
        if (match) shown += 1;
      });
      if (empty) empty.classList.toggle("is-hidden", shown > 0);
      // 全曲カタログへの案内は Music を選んだときだけ出す
      if (catalog) catalog.classList.toggle("is-hidden", filter !== "music");
    };

    tabs.addEventListener("click", (e) => {
      const btn = e.target.closest(".tab");
      if (!btn) return;
      applyFilter(btn.dataset.filter);
      // URLの末尾を書き換えて、そのまま共有できるようにする
      const hash = btn.dataset.filter === "all" ? " " : "#" + btn.dataset.filter;
      if (window.history.replaceState) {
        window.history.replaceState(null, "", hash === " " ? location.pathname : hash);
      }
    });

    // works.html#music のように開いたときは、そのタブから始める
    const fromHash = location.hash.replace("#", "");
    const known = Array.from(tabs.querySelectorAll(".tab")).map((t) => t.dataset.filter);
    applyFilter(known.includes(fromHash) ? fromHash : "all");
  }

  /* ---- カードがふわっと現れる（トップの文字・見出しと同じ floatUp）----
   * スクロールは待たず、読み込み時に上から1枚ずつ順番に出します。
   */
  const revealCards = document.querySelectorAll(".card");
  if (revealCards.length) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const LEAD = 0.25; // 1枚目が出るまでのひと呼吸（見出しと同じ）
    const STEP = 0.08; // 次のカードまでの間隔（ここを変えるとテンポが変わります）

    // 絞り込みで隠れているカードは順番から外す（#music で開いたとき用）
    let i = -1;
    revealCards.forEach((card) => {
      if (!card.classList.contains("is-hidden")) i += 1;
      if (reduce) {
        card.classList.add("is-done");
        return;
      }
      card.style.animationDelay = LEAD + i * STEP + "s";
      // 出終わったらアニメーションを外して、ホバーの動きを効かせる
      card.addEventListener("animationend", () => card.classList.add("is-done"), {
        once: true,
      });
      card.classList.add("is-shown");
    });
  }

  /* ---- YouTubeサムネイル：クリックで再生 ---- */
  document.querySelectorAll(".ytlite").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.yt;
      if (!id) return;
      const frame = document.createElement("iframe");
      frame.src =
        "https://www.youtube-nocookie.com/embed/" + id + "?autoplay=1&rel=0";
      frame.title = btn.getAttribute("aria-label") || "";
      frame.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      frame.allowFullscreen = true;
      btn.replaceWith(frame);
    });
  });

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

  /* ---- Works：画像カードをクリックしたら、すりガラスの上に拡大表示 ---- */
  const modal = document.getElementById("image-modal");
  const modalImage = document.getElementById("modal-image");
  const modalClose = document.getElementById("image-modal-close");
  const imageLinks = document.querySelectorAll(".card__media a[href$='.jpg'], .card__media a[href$='.png']");

  if (modal && modalImage && imageLinks.length) {
    const closeModal = () => {
      modal.classList.remove("is-open");
      document.body.style.overflow = "";
      // ふわっと消えきってから隠す
      window.setTimeout(() => {
        modal.hidden = true;
        modalImage.removeAttribute("src");
      }, 500);
    };

    imageLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        // 新しいタブで開く操作（⌘クリックなど）はそのまま通す
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();

        const img = link.querySelector("img");
        modalImage.src = link.getAttribute("href");
        modalImage.alt = img ? img.alt : "";
        modal.hidden = false;
        document.body.style.overflow = "hidden";
        // 次のフレームで .is-open を付けてふわっと出す
        requestAnimationFrame(() => {
          requestAnimationFrame(() => modal.classList.add("is-open"));
        });
      });
    });

    if (modalClose) modalClose.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) closeModal();
    });
  }
})();
