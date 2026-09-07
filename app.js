(function () {
  "use strict";

  var config = window.APKZY_CONFIG || {};

  var state = {
    settings: {
      name: config.fallbackTitle || "ApkZY",
      description: "Kumpulan APK terbaru",
      detail: "Terbaru & Terlengkap",
      downloadText: "DOWNLOAD",
      footer: "ApkZY",
      theme: "darkweb"
    },
    apks: []
  };

  var activeCategory = "SEMUA";

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(value) {
    var url = String(value || "").trim();

    if (/^https?:\/\//i.test(url)) {
      return url;
    }

    return "#";
  }

  function applyTheme() {
    var allowedThemes = {
      darkweb: true,
      aurora: true,
      ocean: true,
      sunset: true,
      noir: true
    };

    var theme = state.settings.theme;

    if (!allowedThemes[theme]) {
      theme = "darkweb";
    }

    document.body.className = "theme-" + theme;
  }

  function normalizeApk(apk, index) {
    apk = apk || {};

    var name = String(
      apk.name ||
      apk.title ||
      "APK"
    ).trim();

    if (!name) {
      name = "APK";
    }

    var description = String(
      apk.description ||
      apk.desc ||
      ""
    ).trim();

    var category = String(
      apk.category ||
      "Lainnya"
    ).trim();

    if (!category) {
      category = "Lainnya";
    }

    var downloadUrl =
      apk.url ||
      apk.download_url ||
      apk.download ||
      "";

    var image =
      apk.image ||
      apk.image_url ||
      "";

    var downloads = Number(
      apk.downloads != null
        ? apk.downloads
        : apk.download_count
    );

    if (!isFinite(downloads) || downloads < 0) {
      downloads = 0;
    }

    return {
      id: String(
        apk.id ||
        ("apk_" + index)
      ),

      name: name,

      title: name,

      description: description,

      category: category,

      url: downloadUrl,

      download_url: downloadUrl,

      image: image,

      image_url: image,

      downloads: Math.floor(downloads),

      download_count: Math.floor(downloads)
    };
  }

  function setState(data) {
    if (!data || typeof data !== "object") {
      return;
    }

    if (
      data.settings &&
      typeof data.settings === "object"
    ) {
      state.settings = Object.assign(
        {},
        state.settings,
        data.settings
      );
    }

    if (Array.isArray(data.apks)) {
      state.apks = data.apks.map(
        normalizeApk
      );
    } else {
      state.apks = [];
    }

    applyTheme();

    render();
  }

  function render() {
    if ($("brandName")) {
      $("brandName").textContent =
        state.settings.name || "ApkZY";
    }

    if ($("brandDesc")) {
      $("brandDesc").textContent =
        state.settings.description || "";
    }

    if ($("heroName")) {
      $("heroName").textContent =
        state.settings.name || "ApkZY";
    }

    if ($("heroDesc")) {
      $("heroDesc").textContent =
        state.settings.description || "";
    }

    if ($("heroDetail")) {
      $("heroDetail").textContent =
        state.settings.detail || "";
    }

    if ($("footer")) {
      $("footer").textContent =
        state.settings.footer || "ApkZY";
    }

    renderCategories();
    renderCards();
  }

  function renderCategories() {
    var seen = {};
    var categories = ["SEMUA"];

    state.apks.forEach(function (apk) {
      var category =
        apk.category || "Lainnya";

      if (!seen[category]) {
        seen[category] = true;
        categories.push(category);
      }
    });

    if (
      categories.indexOf(
        activeCategory
      ) < 0
    ) {
      activeCategory = "SEMUA";
    }

    if (!$("cats")) {
      return;
    }

    $("cats").innerHTML =
      categories.map(function (category) {

        var active =
          category === activeCategory
            ? "active"
            : "";

        return (
          '<button class="cat ' +
          active +
          '" data-cat="' +
          escapeHtml(category) +
          '">' +
          escapeHtml(category) +
          "</button>"
        );

      }).join("");

    $("cats")
      .querySelectorAll(".cat")
      .forEach(function (button) {

        button.addEventListener(
          "click",
          function () {

            activeCategory =
              button.getAttribute(
                "data-cat"
              ) || "SEMUA";

            renderCategories();
            renderCards();
          }
        );

      });
  }

  function createCard(apk) {

    var imageHtml;

    if (apk.image) {

      imageHtml =
        '<img src="' +
        escapeHtml(apk.image) +
        '" alt="' +
        escapeHtml(apk.name) +
        '" loading="lazy" ' +
        'onerror="this.style.display=\'none\'">';

    } else {

      imageHtml =
        '<div class="placeholder">' +
        "APK" +
        "</div>";
    }

    return (
      '<article class="card">' +

        '<div class="card-media">' +

          imageHtml +

          '<span class="badge">' +
          escapeHtml(apk.category) +
          "</span>" +

        "</div>" +

        "<h2>" +
        escapeHtml(apk.name) +
        "</h2>" +

        "<p>" +
        escapeHtml(
          apk.description ||
          "Tidak ada deskripsi."
        ) +
        "</p>" +

        '<a class="dl" href="' +
        escapeHtml(
          safeUrl(apk.url)
        ) +
        '" target="_blank" rel="noopener">' +

        escapeHtml(
          state.settings.downloadText ||
          "DOWNLOAD"
        ) +

        "</a>" +

      "</article>"
    );
  }

  function renderCards() {

    if (!$("cards")) {
      return;
    }

    var searchInput =
      $("search");

    var query =
      searchInput
        ? String(
            searchInput.value || ""
          ).toLowerCase().trim()
        : "";

    var filtered =
      state.apks.filter(function (apk) {

        var searchable =
          (
            apk.name +
            " " +
            apk.description +
            " " +
            apk.category
          ).toLowerCase();

        var categoryMatch =
          activeCategory === "SEMUA" ||
          apk.category === activeCategory;

        var searchMatch =
          searchable.indexOf(query) >= 0;

        return (
          categoryMatch &&
          searchMatch
        );
      });

    $("cards").innerHTML =
      filtered.map(
        createCard
      ).join("");

    if ($("empty")) {
      $("empty").hidden =
        filtered.length !== 0;
    }
  }

  function loadData() {

    var dataUrl =
      config.dataUrl ||
      "data.json";

    fetch(
      dataUrl,
      {
        cache: "no-store"
      }
    )

      .then(function (response) {

        if (!response.ok) {
          throw new Error(
            "HTTP " +
            response.status
          );
        }

        return response.json();
      })

      .then(function (data) {

        setState(data);

        if ($("status")) {
          $("status").textContent =
            "Online";
        }
      })

      .catch(function () {

        if ($("status")) {
          $("status").textContent =
            "Data gagal dimuat";
        }

        setState({
          settings:
            state.settings,
          apks: []
        });
      });
  }

  if ($("search")) {

    $("search").addEventListener(
      "input",
      function () {
        renderCards();
      }
    );
  }

  loadData();

})();
