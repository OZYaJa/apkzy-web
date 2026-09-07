/* =========================================================
   APKZY PUBLIC WEBSITE
   app.js
   GitHub / Vercel / Supabase
   ========================================================= */

(function () {
  "use strict";

  const CFG = window.APKZY_CONFIG || window.APKZY_CONFIGS || {};

  const SUPABASE_URL =
    CFG.SUPABASE_URL ||
    CFG.supabaseUrl ||
    CFG.URL ||
    "";

  const SUPABASE_KEY =
    CFG.SUPABASE_KEY ||
    CFG.SUPABASE_ANON_KEY ||
    CFG.supabaseKey ||
    CFG.ANON_KEY ||
    "";

  const TABLE =
    CFG.TABLE ||
    CFG.TABLE_NAME ||
    "apps";

  let supabaseClient = null;
  let apps = [];
  let busy = false;

  /* =========================
     HELPER
     ========================= */

  function byId(id) {
    return document.getElementById(id);
  }

  function safe(value) {
    return String(value == null ? "" : value);
  }

  function esc(value) {
    return safe(value).replace(/[&<>"']/g, function (c) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      }[c];
    });
  }

  function num(value) {
    const n = Number(value);
    return (Number.isFinite(n) ? n : 0).toLocaleString("id-ID");
  }

  function first(row, fields, fallback) {
    for (let i = 0; i < fields.length; i++) {
      const key = fields[i];

      if (
        row &&
        row[key] !== undefined &&
        row[key] !== null &&
        String(row[key]).trim() !== ""
      ) {
        return row[key];
      }
    }

    return fallback;
  }

  /* =========================
     NORMALISASI DATA
     ========================= */

  function normalize(row) {
    return {
      id: first(row, ["id", "app_id", "uuid"], ""),
      name: safe(
        first(
          row,
          ["name", "title", "app_name", "nama"],
          "APK"
        )
      ),

      category: safe(
        first(
          row,
          ["category", "kategori", "type"],
          "APK"
        )
      ),

      image: safe(
        first(
          row,
          [
            "image_url",
            "image",
            "logo",
            "icon",
            "icon_url",
            "thumbnail"
          ],
          ""
        )
      ),

      description: safe(
        first(
          row,
          ["description", "desc", "deskripsi", "details"],
          ""
        )
      ),

      download: safe(
        first(
          row,
          [
            "download_url",
            "download_link",
            "download",
            "url",
            "link"
          ],
          ""
        )
      ),

      downloads:
        Number(
          first(
            row,
            [
              "download_count",
              "downloads",
              "total_download",
              "total_downloads"
            ],
            0
          )
        ) || 0
    };
  }

  /* =========================
     STATUS
     ========================= */

  function setStatus(message, error) {
    const ids = [
      "status",
      "connectionStatus",
      "onlineStatus",
      "siteStatus"
    ];

    for (let i = 0; i < ids.length; i++) {
      const el = byId(ids[i]);

      if (el) {
        el.textContent = message;

        if (el.classList) {
          el.classList.toggle("error", !!error);
          el.classList.toggle("err", !!error);
          el.classList.toggle("ok", !error);
        }
      }
    }
  }

  /* =========================
     SUPABASE
     ========================= */

  function createSupabase() {
    if (!SUPABASE_URL || !SUPABASE_KEY) {
      console.warn("APKZY: Supabase belum dikonfigurasi.");
      return false;
    }

    if (
      !window.supabase ||
      typeof window.supabase.createClient !== "function"
    ) {
      console.warn("APKZY: Supabase JS belum tersedia.");
      return false;
    }

    try {
      supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
      );

      return true;
    } catch (error) {
      console.error("APKZY Supabase:", error);
      supabaseClient = null;
      return false;
    }
  }

  /* =========================
     CONTAINER
     ========================= */

  function getAppContainer() {
    const ids = [
      "apps",
      "appList",
      "catalog",
      "catalogList",
      "items",
      "list",
      "apkList",
      "content"
    ];

    for (let i = 0; i < ids.length; i++) {
      const el = byId(ids[i]);
      if (el) return el;
    }

    return null;
  }

  function getRankingContainer() {
    const ids = [
      "ranking",
      "topApps",
      "topRanking",
      "leaderboard"
    ];

    for (let i = 0; i < ids.length; i++) {
      const el = byId(ids[i]);
      if (el) return el;
    }

    return null;
  }

  /* =========================
     RENDER APK
     ========================= */

  function renderApps(list) {
    const container = getAppContainer();

    if (!container) {
      return;
    }

    if (!list.length) {
      container.innerHTML =
        '<div class="empty">Belum ada APK yang tersedia.</div>';
      return;
    }

    container.innerHTML = list.map(function (item) {
      const id = esc(item.id);
      const name = esc(item.name);
      const category = esc(item.category);
      const description = esc(item.description);
      const image = esc(item.image);

      const imageHTML = image
        ? `
          <img
            src="${image}"
            alt="${name}"
            loading="lazy"
            onerror="this.style.display='none'"
          >
        `
        : `
          <div class="apk-placeholder">
            APK
          </div>
        `;

      const buttonHTML = item.download
        ? `
          <button
            type="button"
            class="download-btn"
            data-apk-id="${id}"
          >
            DOWNLOAD
          </button>
        `
        : `
          <button
            type="button"
            class="download-btn disabled"
            disabled
          >
            LINK BELUM TERSEDIA
          </button>
        `;

      return `
        <article
          class="apk-card webItem"
          data-apk-id="${id}"
        >
          <div class="apk-image">
            ${imageHTML}
          </div>

          <div class="apk-info">
            <h3>${name}</h3>

            <div class="apk-meta">
              <span>${category}</span>
              <span>${num(item.downloads)} download</span>
            </div>

            ${
              description
                ? `<p>${description}</p>`
                : ""
            }

            ${buttonHTML}
          </div>
        </article>
      `;
    }).join("");

    container
      .querySelectorAll("[data-apk-id]")
      .forEach(function (button) {
        if (
          button.classList.contains("download-btn") &&
          !button.disabled
        ) {
          button.addEventListener("click", function () {
            downloadApp(button.getAttribute("data-apk-id"));
          });
        }
      });
  }

  /* =========================
     TOP 1 / 2 / 3
     ========================= */

  function renderRanking() {
    const container = getRankingContainer();

    if (!container) {
      return;
    }

    const top = apps
      .slice()
      .sort(function (a, b) {
        return b.downloads - a.downloads;
      })
      .slice(0, 3);

    if (!top.length) {
      container.innerHTML =
        '<div class="empty">Ranking belum tersedia.</div>';
      return;
    }

    container.innerHTML = top.map(function (item, index) {
      return `
        <div
          class="rank-item"
          data-rank="${index + 1}"
        >
          <div class="rank-number">
            TOP ${index + 1}
          </div>

          <div class="rank-name">
            ${esc(item.name)}
          </div>

          <div class="rank-download">
            ${num(item.downloads)} download
          </div>
        </div>
      `;
    }).join("");
  }

  /* =========================
     STATISTIK
     ========================= */

  function renderStats() {
    const total = byId("total");
    const downloads = byId("downloads");
    const top = byId("top");

    if (total) {
      total.textContent = apps.length;
    }

    if (downloads) {
      const totalDownloads = apps.reduce(
        function (sum, item) {
          return sum + item.downloads;
        },
        0
      );

      downloads.textContent = num(totalDownloads);
    }

    if (top) {
      const first = apps
        .slice()
        .sort(function (a, b) {
          return b.downloads - a.downloads;
        })[0];

      top.textContent = first
        ? first.name
        : "-";
    }
  }

  /* =========================
     SEMUA RENDER
     ========================= */

  function renderAll() {
    renderApps(apps);
    renderRanking();
    renderStats();
  }

  /* =========================
     SEARCH
     ========================= */

  function performSearch() {
    const input =
      byId("search") ||
      byId("searchInput") ||
      document.querySelector(
        'input[type="search"]'
      );

    if (!input) {
      renderApps(apps);
      return;
    }

    const query =
      safe(input.value)
        .trim()
        .toLowerCase();

    if (!query) {
      renderApps(apps);
      return;
    }

    const result = apps.filter(function (item) {
      return (
        item.name
          .toLowerCase()
          .includes(query) ||

        item.category
          .toLowerCase()
          .includes(query) ||

        item.description
          .toLowerCase()
          .includes(query)
      );
    });

    renderApps(result);
  }

  /* =========================
     LOAD DATA
     ========================= */

  async function loadApps() {
    if (busy) {
      return;
    }

    busy = true;

    try {
      if (!supabaseClient) {
        apps = [];
        renderAll();

        setStatus(
          "Website siap. Supabase belum dikonfigurasi.",
          true
        );

        return;
      }

      setStatus("Memuat katalog APK...");

      const result = await supabaseClient
        .from(TABLE)
        .select("*");

      if (result.error) {
        throw result.error;
      }

      apps = (result.data || [])
        .map(normalize)
        .sort(function (a, b) {
          return b.downloads - a.downloads;
        });

      renderAll();

      setStatus(
        "Katalog APK berhasil dimuat."
      );

    } catch (error) {
      console.error(
        "APKZY: gagal mengambil katalog",
        error
      );

      apps = [];
      renderAll();

      setStatus(
        "Katalog gagal dimuat. Periksa Supabase dan RLS.",
        true
      );

    } finally {
      busy = false;
    }
  }

  /* =========================
     DOWNLOAD
     ========================= */

  async function downloadApp(id) {
    const item = apps.find(function (app) {
      return String(app.id) === String(id);
    });

    if (!item) {
      setStatus(
        "APK tidak ditemukan.",
        true
      );
      return;
    }

    if (!item.download) {
      setStatus(
        "Link download belum tersedia.",
        true
      );
      return;
    }

    /*
     * Buka link terlebih dahulu agar
     * browser tidak memblokir karena
     * proses update database.
     */
    const downloadURL = item.download;

    try {
      if (
        supabaseClient &&
        item.id
      ) {
        const newCount =
          item.downloads + 1;

        const updateData = {};

        updateData[
          CFG.DOWNLOAD_FIELD ||
          "download_count"
        ] = newCount;

        const result =
          await supabaseClient
            .from(TABLE)
            .update(updateData)
            .eq("id", item.id);

        if (!result.error) {
          item.downloads = newCount;

          renderAll();
        } else {
          console.warn(
            "APKZY: counter download gagal",
            result.error
          );
        }
      }
    } catch (error) {
      console.warn(
        "APKZY: counter error",
        error
      );
    }

    window.open(
      downloadURL,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /* =========================
     EVENT
     ========================= */

  function bindEvents() {
    const input =
      byId("search") ||
      byId("searchInput") ||
      document.querySelector(
        'input[type="search"]'
      );

    if (input) {
      input.addEventListener(
        "input",
        performSearch
      );
    }

    document
      .querySelectorAll("[data-search]")
      .forEach(function (element) {
        element.addEventListener(
          "click",
          function () {
            if (!input) {
              return;
            }

            input.value =
              element.getAttribute(
                "data-search"
              ) || "";

            performSearch();
          }
        );
      });
  }

  /* =========================
     PUBLIC API
     ========================= */

  window.ApkZY =
    window.ApkZY || {};

  window.ApkZY.reload =
    loadApps;

  window.ApkZY.search =
    performSearch;

  window.ApkZY.getApps =
    function () {
      return apps.slice();
    };

  window.ApkZY.download =
    downloadApp;

  /* =========================
     START
     ========================= */

  document.addEventListener(
    "DOMContentLoaded",
    function () {
      bindEvents();
      createSupabase();
      loadApps();
    }
  );

})();
