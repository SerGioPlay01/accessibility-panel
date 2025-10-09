/*!
 * Универсальная панель доступности v3.2
 * Автор: SerGio Play | https://sergioplay-dev.vercel.app/
 * Лицензия: MIT License
 *
 * Copyright (c) 2025 SerGio Play
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 * Все изменения стиля применяются только к контенту сайта
 */

class AccessibilityPanel {
  constructor(config = {}) {
    this.config = Object.assign(
      {
        panel: "#accessibilityPanel",
        overlay: "#accessibilityOverlay",
        floatingBtn: ".floating-accessibility-btn",
        headerBtn: ".accessibility-toggle",
        closeBtn: ".close-panel",
        announcer: "#sr-announcements",
        textSlider: "#textSizeSlider",
        hideImagesToggle: "#hideImages",
        readingLineToggle: "#readingLine",
        contentWrapper: "main",
        skipLink: "#skip-to-accessibility",
      },
      config
    );

    // Настройки по умолчанию с улучшенными значениями доступности
    this.settings = {
      customFontSize: 1.0,
      contrast: "normal",
      lineHeight: 1.6, // Улучшенное значение по умолчанию для читаемости
      letterSpacing: 0,
      wordSpacing: 0,
      fontFamily: "system-ui", // Системный шрифт для лучшей читаемости
      underlineLinks: 0,
      highlightHeadings: 0,
      highlightLinks: 0,
      cursorSize: 1,
      animationSpeed: 1,
      focusEffect: 1,
      scrollBehavior: 0,
      readingLine: 0,
      hoverSpeech: 0,
      speechRate: 1.0,
      speechVolume: 0.8,
      hideImages: 0,
      keyboardNav: 0,
      dyslexia: 0,
      reducedMotion: 0,
    };

    this.contentEl =
      document.querySelector(".page-content") ||
      document.querySelector(this.config.contentWrapper);
    this.readingLineEl = null;
    this.hintBox = null;
    this.readingLineHandler = null;
    this.lastHint = "";
    this.hoverSpeechHandler = null;
    this.hoverLeaveHandler = null;
    this.lastHoverText = "";
    this.currentUtterance = null;
    this.isSpeaking = false;

    // Состояние для управления фокусом
    this.focusManager = {
      trapElement: null,
      previousFocus: null,
      focusableElements: [],
    };

    this.init();
  }

  init() {
    try {
      // Проверка поддержки браузера с улучшенной обработкой ошибок
      if (!this.checkBrowserSupport()) {
        this.showCompatibilityWarning();
        return;
      }

      // Создание необходимых DOM элементов для доступности
      this.createAccessibilityElements();

      this.bindEvents();
      this.restoreSettings();
      this.optimizePerformance();
      this.announce(
        "Панель доступности загружена. Используйте Tab для навигации."
      );

      // Добавление индикатора готовности
      document.body.classList.add(
        "accessibility-ready",
        "accessibility-enabled"
      );

      // Инициализация ARIA атрибутов
      this.initializeARIA();
    } catch (error) {
      console.error("Ошибка инициализации панели доступности:", error);
      this.announce("Ошибка загрузки панели доступности");
    }
  }

  createAccessibilityElements() {
    // Создание элемента для скринридеров
    if (!document.getElementById("sr-announcements")) {
      const announcer = document.createElement("div");
      announcer.id = "sr-announcements";
      announcer.className = "sr-only";
      announcer.setAttribute("aria-live", "polite");
      announcer.setAttribute("aria-atomic", "true");
      document.body.appendChild(announcer);
    }
  }

  initializeARIA() {
    const panel = document.querySelector(this.config.panel);
    if (panel) {
      panel.setAttribute("role", "dialog");
      panel.setAttribute("aria-modal", "true");
      panel.setAttribute("aria-label", "Панель доступности");
      panel.setAttribute("aria-describedby", "accessibility-panel-description");
    }

    // Добавление описания для скринридеров
    if (!document.getElementById("accessibility-panel-description")) {
      const description = document.createElement("div");
      description.id = "accessibility-panel-description";
      description.className = "sr-only";
      description.textContent =
        "Настройте параметры доступности для комфортного использования сайта";
      if (panel) {
        panel.appendChild(description);
      }
    }

    // Установка ARIA атрибутов для всех интерактивных элементов
    this.initializeInteractiveElementsARIA();
  }

  initializeInteractiveElementsARIA() {
    // Ползунки
    document.querySelectorAll('input[type="range"]').forEach((slider) => {
      const valueDisplay = slider.parentElement?.querySelector(".slider-value");
      if (valueDisplay) {
        slider.setAttribute("aria-valuenow", slider.value);
        slider.setAttribute("aria-valuetext", valueDisplay.textContent);
        slider.setAttribute("aria-valuemin", slider.min);
        slider.setAttribute("aria-valuemax", slider.max);
      }
    });

    // Переключатели
    document.querySelectorAll(".ios-toggle").forEach((toggle) => {
      const label = toggle.closest("label");
      if (label) {
        const labelText =
          label.querySelector("span")?.textContent || "Переключатель";
        toggle.setAttribute("aria-label", labelText);
      }
    });

    // Кнопки
    document
      .querySelectorAll(
        ".contrast-btn, .reset-btn, .save-profile-btn, .load-profile-btn"
      )
      .forEach((btn) => {
        if (!btn.getAttribute("aria-label")) {
          btn.setAttribute("aria-label", btn.textContent.trim());
        }
      });
  }

  checkBrowserSupport() {
    const features = {
      speechSynthesis: "speechSynthesis" in window,
      localStorage: "localStorage" in window,
      classList: "classList" in document.createElement("div"),
      addEventListener: "addEventListener" in window,
      querySelector: "querySelector" in document,
      matchMedia: "matchMedia" in window,
    };

    const unsupported = Object.entries(features)
      .filter(([feature, supported]) => !supported)
      .map(([feature]) => feature);

    if (unsupported.length > 0) {
      console.warn("Неподдерживаемые функции:", unsupported);
      return false;
    }

    return true;
  }

  showCompatibilityWarning() {
    const warning = document.createElement("div");
    warning.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b6b;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10000;
            font-family: system-ui;
        `;
    warning.textContent =
      "Ваш браузер не поддерживает все функции доступности. Рекомендуем обновить браузер.";
    document.body.appendChild(warning);

    setTimeout(() => {
      warning.remove();
    }, 10000);
  }

  optimizePerformance() {
    // Дебаунс для ресайза окна
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        this.handleResize();
      }, 250);
    });

    // Оптимизация скролла
    let scrollTimer;
    window.addEventListener(
      "scroll",
      () => {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          this.handleScroll();
        }, 100);
      },
      { passive: true }
    );

    // Поддержка жестов для мобильных
    this.initTouchGestures();

    // Предзагрузка критических элементов
    this.preloadCriticalElements();

    // Поддержка prefers-reduced-motion
    this.handleReducedMotionPreference();
  }

  handleReducedMotionPreference() {
    const reducedMotionQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    );

    const handleReducedMotion = (e) => {
      this.settings.reducedMotion = e.matches ? 1 : 0;
      if (e.matches) {
        document.body.classList.add("reduced-motion-enabled");
        this.announce("Режим уменьшенного движения активирован системой");
      } else {
        document.body.classList.remove("reduced-motion-enabled");
      }
    };

    reducedMotionQuery.addEventListener("change", handleReducedMotion);
    handleReducedMotion(reducedMotionQuery);
  }

  handleResize() {
    const panel = document.querySelector(this.config.panel);
    if (panel && panel.classList.contains("active")) {
      this.adjustPanelSize();
    }
  }

  handleScroll() {
    if (this.readingLineEl) {
      const rect = this.readingLineEl.getBoundingClientRect();
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        this.readingLineEl.style.opacity = "0.5";
      } else {
        this.readingLineEl.style.opacity = "1";
      }
    }
  }

  adjustPanelSize() {
    const panel = document.querySelector(this.config.panel);
    if (!panel) return;

    const maxHeight = window.innerHeight * 0.9;
    panel.style.maxHeight = maxHeight + "px";
  }

  initTouchGestures() {
    const panel = document.querySelector(this.config.panel);
    if (!panel) return;

    let startY = 0;
    let currentY = 0;
    let isDragging = false;

    panel.addEventListener(
      "touchstart",
      (e) => {
        startY = e.touches[0].clientY;
        isDragging = true;
      },
      { passive: true }
    );

    panel.addEventListener(
      "touchmove",
      (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        const deltaY = currentY - startY;

        if (deltaY > 100) {
          this.closePanel();
          isDragging = false;
        }
      },
      { passive: true }
    );

    panel.addEventListener(
      "touchend",
      () => {
        isDragging = false;
      },
      { passive: true }
    );
  }

  preloadCriticalElements() {
    this.cachedElements = {
      panel: document.querySelector(this.config.panel),
      overlay: document.querySelector(this.config.overlay),
      content: document.querySelector(".accessibility-content"),
      announcer: document.querySelector(this.config.announcer),
    };
  }

  bindEvents() {
    const cfg = this.config;

    // Основные события
    this.safeBind(cfg.floatingBtn, "click", () => this.openPanel());
    this.safeBind(cfg.headerBtn, "click", () => this.openPanel());
    this.safeBind(cfg.closeBtn, "click", () => this.closePanel());
    this.safeBind(cfg.overlay, "click", () => this.closePanel());

    // Клавиатурные события
    document.addEventListener("keydown", (e) => {
      this.handleGlobalKeydown(e);
    });

    // События для улучшения доступности
    this.bindAccessibilityEvents();

    // Инициализация элементов управления
    this.initializeSliders();
    this.initializeToggles();
    this.initializeButtons();

    // События для мобильных устройств
    this.bindMobileEvents();
  }

  handleGlobalKeydown(e) {
    switch (e.key) {
      case "Escape":
        if (this.isPanelOpen()) {
          this.closePanel();
          e.preventDefault();
        }
        break;
      case "Tab":
        if (this.isPanelOpen()) {
          this.handleFocusTrap(e);
        }
        break;
    }
  }

  handleFocusTrap(e) {
    const panel = document.querySelector(this.config.panel);
    if (!panel || !panel.contains(document.activeElement)) return;

    const focusableElements = this.getFocusableElements(panel);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (e.shiftKey && document.activeElement === firstElement) {
      lastElement.focus();
      e.preventDefault();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      firstElement.focus();
      e.preventDefault();
    }
  }

  getFocusableElements(container) {
    const focusableSelectors = [
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "a[href]",
      '[tabindex]:not([tabindex="-1"])',
      "details",
      "summary",
    ].join(",");

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((el) => {
        const style = window.getComputedStyle(el);
        return (
          style.visibility !== "hidden" &&
          style.display !== "none" &&
          el.offsetWidth > 0 &&
          el.offsetHeight > 0
        );
      })
      .sort((a, b) => {
        const aIndex = parseInt(a.getAttribute("tabindex") || 0);
        const bIndex = parseInt(b.getAttribute("tabindex") || 0);
        return aIndex - bIndex;
      });
  }

  bindAccessibilityEvents() {
    // Авто-озвучка изменений для скринридеров
    document.addEventListener("change", (e) => {
      if (e.target.type === "range" || e.target.type === "checkbox") {
        this.announceChange(e.target);
      }
    });

    // Улучшенная фокусировка
    document.addEventListener("focusin", (e) => {
      if (this.isPanelOpen() && e.target.closest(this.config.panel)) {
        this.highlightFocusedElement(e.target);
      }
    });
  }

  bindMobileEvents() {
    // Улучшенная поддержка сенсорных устройств
    document.addEventListener(
      "touchstart",
      (e) => {
        // Увеличиваем область касания для маленьких элементов
        const target = e.target;
        if (
          target.classList.contains("ios-toggle") ||
          target.classList.contains("contrast-btn") ||
          target.closest(".slider-container")
        ) {
          target.style.transform = "scale(0.95)";
          setTimeout(() => {
            target.style.transform = "";
          }, 150);
        }
      },
      { passive: true }
    );
  }

  announceChange(element) {
    let announcement = "";

    if (element.type === "range") {
      const valueDisplay =
        element.parentElement?.querySelector(".slider-value");
      const label =
        element.closest("label")?.querySelector("span")?.textContent ||
        "Настройка";
      announcement = `${label}: ${valueDisplay?.textContent || element.value}`;
    } else if (element.type === "checkbox") {
      const label =
        element.closest("label")?.querySelector("span")?.textContent ||
        "Переключатель";
      announcement = `${label}: ${element.checked ? "включено" : "выключено"}`;
    }

    if (announcement) {
      this.announce(announcement);
    }
  }

  highlightFocusedElement(element) {
    // Временное выделение сфокусированного элемента
    element.style.outline = "3px solid #4A90E2";
    element.style.outlineOffset = "2px";

    setTimeout(() => {
      element.style.outline = "";
      element.style.outlineOffset = "";
    }, 1000);
  }

  safeBind(selector, event, handler) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => {
      el.addEventListener(event, handler);
    });
  }

  updateSliderTrack(slider, value) {
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const percentage = ((value - min) / (max - min)) * 100;

    slider.style.setProperty("--value", `${percentage}%`);

    // Обновление ARIA атрибутов
    const valueDisplay = slider.parentElement?.querySelector(".slider-value");
    if (valueDisplay) {
      slider.setAttribute("aria-valuenow", value);
      slider.setAttribute("aria-valuetext", valueDisplay.textContent);
    }

    slider.classList.add("updating");
    setTimeout(() => {
      slider.classList.remove("updating");
    }, 300);

    const activeColor = "#4A90E2";
    const inactiveColor = "#e9ecef";
    slider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${inactiveColor} ${percentage}%, ${inactiveColor} 100%)`;
  }

  updateToggleStatus(toggleId, isActive) {
    const toggle = document.getElementById(toggleId);
    const label = toggle?.closest(".toggle-label");

    if (label) {
      label.classList.toggle("active", isActive);
      // Обновление ARIA состояния
      toggle.setAttribute("aria-checked", isActive.toString());
    }
  }

  initializeToggles() {
    const toggles = [
      {
        id: "underlineLinksToggle",
        handler: this.handleUnderlineLinks.bind(this),
      },
      {
        id: "highlightHeadingsToggle",
        handler: this.handleHighlightHeadings.bind(this),
      },
      {
        id: "highlightLinksToggle",
        handler: this.handleHighlightLinks.bind(this),
      },
      {
        id: "scrollBehaviorToggle",
        handler: this.handleScrollBehavior.bind(this),
      },
      { id: "readingLineToggle", handler: this.handleReadingLine.bind(this) },
      { id: "hoverSpeechToggle", handler: this.handleHoverSpeech.bind(this) },
      { id: "hideImagesToggle", handler: this.handleHideImages.bind(this) },
      { id: "keyboardNavToggle", handler: this.handleKeyboardNav.bind(this) },
      { id: "dyslexiaToggle", handler: this.handleDyslexia.bind(this) },
    ];

    toggles.forEach(({ id, handler }) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        // Установка начальных ARIA атрибутов
        toggle.setAttribute("role", "switch");
        toggle.setAttribute("aria-checked", toggle.checked.toString());

        toggle.addEventListener("change", (e) => {
          const value = e.target.checked ? 1 : 0;
          handler(value);
        });

        // Поддержка пробела для переключения
        toggle.addEventListener("keydown", (e) => {
          if (e.key === " ") {
            e.preventDefault();
            toggle.checked = !toggle.checked;
            toggle.dispatchEvent(new Event("change"));
          }
        });
      }
    });
  }

  initializeSliders() {
    const sliders = [
      {
        id: "textSizeSlider",
        handler: this.handleTextSize.bind(this),
        format: (v) => Math.round(v * 100) + "%",
        type: "percentage",
      },
      {
        id: "lineHeightSlider",
        handler: this.handleLineHeight.bind(this),
        format: (v) => v.toFixed(1),
        type: "level",
      },
      {
        id: "letterSpacingSlider",
        handler: this.handleLetterSpacing.bind(this),
        format: (v) => v + "px",
        type: "pixels",
      },
      {
        id: "wordSpacingSlider",
        handler: this.handleWordSpacing.bind(this),
        format: (v) => v + "px",
        type: "pixels",
      },
      {
        id: "cursorSizeSlider",
        handler: this.handleCursorSize.bind(this),
        format: (v) => ["Обычный", "Большой", "Очень большой"][v - 1],
        type: "level",
      },
      {
        id: "animationSpeedSlider",
        handler: this.handleAnimationSpeed.bind(this),
        format: (v) =>
          ["Выкл", "Медленная", "Обычная", "Быстрая"][Math.round(v * 2)],
        type: "level",
      },
      {
        id: "focusEffectSlider",
        handler: this.handleFocusEffect.bind(this),
        format: (v) => ["Выкл", "Обычный", "Усиленный"][v],
        type: "level",
      },
      {
        id: "speechRateSlider",
        handler: this.handleSpeechRate.bind(this),
        format: (v) => v.toFixed(1) + "x",
        type: "multiplier",
      },
      {
        id: "speechVolumeSlider",
        handler: this.handleSpeechVolume.bind(this),
        format: (v) => Math.round(v * 100) + "%",
        type: "percentage",
      },
    ];

    sliders.forEach(({ id, handler, format, type }) => {
      const slider = document.getElementById(id);
      const valueDisplay =
        slider?.parentElement?.querySelector(".slider-value");

      if (slider && valueDisplay) {
        // Установка ARIA атрибутов
        slider.setAttribute("role", "slider");
        slider.setAttribute("aria-orientation", "horizontal");
        valueDisplay.setAttribute("data-type", type);

        slider.addEventListener("input", (e) => {
          const value = parseFloat(e.target.value);
          const formattedValue = format(value);

          // Плавное обновление отображения
          valueDisplay.classList.add("updating");
          setTimeout(() => {
            valueDisplay.classList.remove("updating");
          }, 400);

          valueDisplay.style.opacity = "0.7";
          setTimeout(() => {
            valueDisplay.textContent = formattedValue;
            valueDisplay.style.opacity = "1";
          }, 100);

          if (formattedValue.length > 8) {
            valueDisplay.classList.add("long-text");
          } else {
            valueDisplay.classList.remove("long-text");
          }

          this.updateSliderTrack(slider, value);
          handler(value);
        });

        // Улучшенная клавиатурная навигация
        slider.addEventListener("keydown", (e) => {
          const step = parseFloat(slider.step) || 0.1;
          let newValue = parseFloat(slider.value);

          switch (e.key) {
            case "ArrowRight":
            case "ArrowUp":
              newValue += step;
              break;
            case "ArrowLeft":
            case "ArrowDown":
              newValue -= step;
              break;
            case "Home":
              newValue = parseFloat(slider.min);
              break;
            case "End":
              newValue = parseFloat(slider.max);
              break;
            case "PageUp":
              newValue += step * 5;
              break;
            case "PageDown":
              newValue -= step * 5;
              break;
            default:
              return;
          }

          e.preventDefault();
          newValue = Math.max(
            parseFloat(slider.min),
            Math.min(parseFloat(slider.max), newValue)
          );
          slider.value = newValue;
          slider.dispatchEvent(new Event("input"));
        });

        // Инициализация начального значения
        const initialValue = parseFloat(slider.value);
        const initialFormattedValue = format(initialValue);
        valueDisplay.textContent = initialFormattedValue;

        if (initialFormattedValue.length > 8) {
          valueDisplay.classList.add("long-text");
        }

        this.updateSliderTrack(slider, initialValue);
      }
    });
  }

  initializeButtons() {
    // Кнопки контраста
    this.bindActionButtons(".contrast-btn", (btn) => {
      this.setContrast(btn.dataset.contrast);
      // Обновление состояния активной кнопки
      document
        .querySelectorAll(".contrast-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      btn.focus();
    });

    // Управляющие кнопки
    this.safeBind(".reset-btn", "click", () => this.resetSettings());
    this.safeBind(".save-profile-btn", "click", () => this.saveProfile());
    this.safeBind(".load-profile-btn", "click", () => this.loadProfile());

    // Улучшенная доступность для кнопок
    document
      .querySelectorAll(
        ".contrast-btn, .reset-btn, .save-profile-btn, .load-profile-btn"
      )
      .forEach((btn) => {
        btn.setAttribute("role", "button");
        btn.setAttribute("tabindex", "0");

        btn.addEventListener("keydown", (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            btn.click();
          }
        });
      });
  }

  bindActionButtons(selector, callback) {
    document.querySelectorAll(selector).forEach((btn) => {
      btn.addEventListener("click", () => callback(btn));
    });
  }

  // ============ Обработчики настроек ============

  handleTextSize(value) {
    if (this.contentEl) {
      this.contentEl.style.fontSize = value + "em";
      // Установка минимального размера шрифта для доступности
      const computedSize = parseFloat(
        getComputedStyle(this.contentEl).fontSize
      );
      if (computedSize < 12) {
        this.contentEl.style.fontSize = "12px";
      }
    }
    this.settings.customFontSize = value;
    this.saveSettings();
  }

  handleLineHeight(value) {
    if (this.contentEl) this.contentEl.style.lineHeight = value;
    this.settings.lineHeight = value;
    this.saveSettings();
    this.announce(`Межстрочный интервал: ${value}`);
  }

  handleLetterSpacing(value) {
    if (this.contentEl) this.contentEl.style.letterSpacing = value + "px";
    this.settings.letterSpacing = value;
    this.saveSettings();
    this.announce(`Межбуквенный интервал: ${value}px`);
  }

  handleWordSpacing(value) {
    if (this.contentEl) this.contentEl.style.wordSpacing = value + "px";
    this.settings.wordSpacing = value;
    this.saveSettings();
    this.announce(`Отступы между словами: ${value}px`);
  }

  handleUnderlineLinks(value) {
    document.body.classList.toggle("underline-links-enabled", value === 1);
    this.updateToggleStatus("underlineLinksToggle", value === 1);
    this.settings.underlineLinks = value;
    this.saveSettings();
    this.announce(`Подчеркивание ссылок: ${value ? "включено" : "выключено"}`);
  }

  handleHighlightHeadings(value) {
    document.body.classList.toggle("enhanced-headings-enabled", value === 1);
    this.updateToggleStatus("highlightHeadingsToggle", value === 1);
    this.settings.highlightHeadings = value;
    this.saveSettings();
    this.announce(`Выделение заголовков: ${value ? "включено" : "выключено"}`);
  }

  handleHighlightLinks(value) {
    document.body.classList.toggle("enhanced-links-enabled", value === 1);
    this.updateToggleStatus("highlightLinksToggle", value === 1);
    this.settings.highlightLinks = value;
    this.saveSettings();
    this.announce(`Выделение ссылок: ${value ? "включено" : "выключено"}`);
  }

  handleCursorSize(value) {
    document.body.classList.remove(
      "cursor-large-enabled",
      "cursor-extra-large-enabled"
    );

    switch (value) {
      case 2:
        document.body.classList.add("cursor-large-enabled");
        break;
      case 3:
        document.body.classList.add("cursor-extra-large-enabled");
        break;
    }

    this.settings.cursorSize = value;
    this.saveSettings();

    const cursorNames = ["Обычный", "Большой", "Очень большой"];
    this.announce(`Размер курсора: ${cursorNames[value - 1]}`);
  }

  handleAnimationSpeed(value) {
    document.body.classList.remove(
      "animation-slow-enabled",
      "animation-disabled-enabled"
    );
    if (value === 0) document.body.classList.add("animation-disabled-enabled");
    if (value === 0.5) document.body.classList.add("animation-slow-enabled");
    this.settings.animationSpeed = value;
    this.saveSettings();
    this.announce(
      `Скорость анимаций: ${
        ["отключена", "медленная", "обычная", "быстрая"][Math.round(value * 2)]
      }`
    );
  }

  handleFocusEffect(value) {
    document.body.classList.remove(
      "focus-enhanced-enabled",
      "focus-strong-enabled"
    );
    if (value === 1) document.body.classList.add("focus-enhanced-enabled");
    if (value === 2) document.body.classList.add("focus-strong-enabled");
    this.settings.focusEffect = value;
    this.saveSettings();
    this.announce(
      `Эффект фокуса: ${["выключен", "обычный", "усиленный"][value]}`
    );
  }

  handleScrollBehavior(value) {
    document.body.classList.toggle("smooth-scroll-enabled", value === 1);
    this.updateToggleStatus("scrollBehaviorToggle", value === 1);
    this.settings.scrollBehavior = value;
    this.saveSettings();
    this.announce(`Плавная прокрутка: ${value ? "включена" : "выключена"}`);
  }

  handleReadingLine(value) {
    this.updateToggleStatus("readingLineToggle", value === 1);
    this.settings.readingLine = value;
    if (value === 1) this.enableReadingLine();
    else this.disableReadingLine();
    this.saveSettings();
  }

  handleHoverSpeech(value) {
    this.updateToggleStatus("hoverSpeechToggle", value === 1);
    this.settings.hoverSpeech = value;
    if (value === 1) this.enableHoverSpeech();
    else this.disableHoverSpeech();
    this.saveSettings();
  }

  handleSpeechRate(value) {
    this.settings.speechRate = value;
    this.saveSettings();
    this.announce(`Скорость озвучки: ${value}x`);
  }

  handleSpeechVolume(value) {
    this.settings.speechVolume = value;
    this.saveSettings();
    this.announce(`Громкость озвучки: ${Math.round(value * 100)}%`);
  }

  handleHideImages(value) {
    document.body.classList.toggle("hide-images-enabled", value === 1);
    this.updateToggleStatus("hideImagesToggle", value === 1);
    this.settings.hideImages = value;
    this.saveSettings();
    this.announce(`Режим без изображений: ${value ? "включен" : "выключен"}`);
  }

  handleKeyboardNav(value) {
    document.body.classList.toggle("keyboard-navigation-enabled", value === 1);
    this.updateToggleStatus("keyboardNavToggle", value === 1);
    this.settings.keyboardNav = value;
    this.saveSettings();
    this.announce(
      `Клавиатурная навигация: ${value ? "включена" : "выключена"}`
    );
  }

  handleDyslexia(value) {
    document.body.classList.toggle("dyslexia-mode-enabled", value === 1);
    this.updateToggleStatus("dyslexiaToggle", value === 1);
    this.settings.dyslexia = value;
    this.saveSettings();
    this.announce(`Режим дислексии: ${value ? "включен" : "выключен"}`);
  }

  setContrast(type) {
    const colorSchemes = [
      "high-contrast",
      "dark-theme",
      "inverted-colors",
      "sepia",
      "blue-light",
      "green-calm",
    ];

    // Удаляем все классы цветовых схем
    colorSchemes.forEach((scheme) => {
      document.body.classList.remove(`${scheme}-enabled`);
      document.documentElement.classList.remove(`${scheme}-enabled`);
    });

    // Применяем выбранную схему
    if (type !== "normal") {
      document.body.classList.add(`${type}-enabled`);
      document.documentElement.classList.add(`${type}-enabled`);
    }

    this.settings.contrast = type;
    this.saveSettings();

    const schemeNames = {
      normal: "Обычная",
      "high-contrast": "Высокий контраст",
      "dark-theme": "Тёмная тема",
      "inverted-colors": "Инверсия цветов",
      sepia: "Сепия",
      "blue-light": "Синий свет",
      "green-calm": "Зелёная спокойная",
    };

    this.announce(`Цветовая схема: ${schemeNames[type] || type}`);

    // Обновляем активные кнопки
    document.querySelectorAll(".contrast-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.contrast === type);
      btn.setAttribute(
        "aria-pressed",
        btn.dataset.contrast === type ? "true" : "false"
      );
    });
  }

  // ============ Функции доступности ============

  enableReadingLine() {
    if (this.readingLineEl) return;

    this.readingLineEl = document.createElement("div");
    Object.assign(this.readingLineEl.style, {
      position: "fixed",
      left: "0",
      width: "100%",
      height: "3px",
      background: "rgba(0, 150, 255, 0.6)",
      border: "none",
      pointerEvents: "none",
      zIndex: "999999",
      transition: "top 0.1s ease",
      display: "none",
    });
    this.readingLineEl.setAttribute("aria-hidden", "true");
    document.body.appendChild(this.readingLineEl);

    this.hintBox = document.createElement("div");
    Object.assign(this.hintBox.style, {
      position: "fixed",
      background: "linear-gradient(135deg, #2c5aa0, #4a90e2)",
      color: "#fff",
      padding: "8px 12px",
      borderRadius: "8px",
      fontSize: "14px",
      fontWeight: "500",
      pointerEvents: "none",
      zIndex: "1000000",
      display: "none",
      maxWidth: "300px",
      wordWrap: "break-word",
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
    });
    this.hintBox.setAttribute("aria-hidden", "true");
    document.body.appendChild(this.hintBox);

    let debounceTimer;
    document.addEventListener(
      "mousemove",
      (this.readingLineHandler = (e) => {
        this.readingLineEl.style.display = "block";
        this.readingLineEl.style.top = e.clientY - 1 + "px";

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          const el = document.elementFromPoint(e.clientX, e.clientY);
          this.handleElementHover(el, e.clientX, e.clientY);
        }, 50);
      })
    );

    document.addEventListener("mouseleave", () => {
      this.readingLineEl.style.display = "none";
      this.hintBox.style.display = "none";
    });

    this.announce(
      "Линейка чтения включена. Наводите курсор на текст для озвучки."
    );
  }

  disableReadingLine() {
    if (this.readingLineEl) {
      this.readingLineEl.remove();
      this.readingLineEl = null;
    }
    if (this.hintBox) {
      this.hintBox.remove();
      this.hintBox = null;
    }
    if (this.readingLineHandler) {
      document.removeEventListener("mousemove", this.readingLineHandler);
      this.readingLineHandler = null;
    }
    this.lastHint = "";
    this.announce("Линейка чтения выключена");
  }

  handleElementHover(el, clientX, clientY) {
    if (!el || !this.hintBox) return;

    let text = this.getElementText(el);

    if (text && text.length > 0) {
      const maxWords = 10;
      const words = text.split(/\s+/);
      if (words.length > maxWords) {
        text = words.slice(0, maxWords).join(" ") + "...";
      }

      this.hintBox.textContent = text;

      const offset = 15;
      let left = clientX + offset;
      let top = clientY + offset;

      const hintRect = this.hintBox.getBoundingClientRect();
      if (left + hintRect.width > window.innerWidth) {
        left = clientX - hintRect.width - offset;
      }
      if (top + hintRect.height > window.innerHeight) {
        top = clientY - hintRect.height - offset;
      }

      this.hintBox.style.left = Math.max(10, left) + "px";
      this.hintBox.style.top = Math.max(10, top) + "px";
      this.hintBox.style.display = "block";

      if (this.lastHint !== text) {
        this.lastHint = text;
        this.speakText(text);
      }
    } else {
      this.hintBox.style.display = "none";
      this.lastHint = "";
    }
  }

  getElementText(el) {
    if (!el) return "";

    // Пропускаем элементы панели доступности
    if (el.closest("#accessibilityPanel")) return "";

    if (el.alt && el.tagName === "IMG") {
      return `Изображение: ${el.alt}`;
    }
    if (el.title) {
      return el.title;
    }
    if (el.getAttribute("aria-label")) {
      return el.getAttribute("aria-label");
    }
    if (el.tagName === "A" && el.href) {
      const linkText = el.textContent?.trim();
      return linkText ? `Ссылка: ${linkText}` : `Ссылка`;
    }
    if (el.tagName === "BUTTON") {
      const buttonText = el.textContent?.trim();
      return buttonText ? `Кнопка: ${buttonText}` : "Кнопка";
    }
    if (["H1", "H2", "H3", "H4", "H5", "H6"].includes(el.tagName)) {
      const headingText = el.textContent?.trim();
      return headingText ? `Заголовок: ${headingText}` : "";
    }

    const text = el.textContent?.trim();
    return text && text.length > 2 && !el.querySelector("*") ? text : "";
  }

  enableHoverSpeech() {
    if (this.hoverSpeechHandler) return;

    this.hoverSpeechHandler = (e) => {
      const el = e.target;
      if (!el || !this.contentEl?.contains(el)) return;

      const text = this.getElementText(el);
      if (text && text !== this.lastHoverText) {
        this.lastHoverText = text;
        this.speakHoverText(text);
      }
    };

    this.hoverLeaveHandler = () => {
      this.lastHoverText = "";
      this.stopSpeech();
    };

    if (this.contentEl) {
      this.contentEl.addEventListener("mouseover", this.hoverSpeechHandler);
      this.contentEl.addEventListener("mouseleave", this.hoverLeaveHandler);
    }

    this.announce("Озвучка при наведении включена");
  }

  disableHoverSpeech() {
    if (this.hoverSpeechHandler && this.contentEl) {
      this.contentEl.removeEventListener("mouseover", this.hoverSpeechHandler);
      this.contentEl.removeEventListener("mouseleave", this.hoverLeaveHandler);
    }
    this.lastHoverText = "";
    this.stopSpeech();
    this.announce("Озвучка при наведении выключена");
  }

  speakText(text) {
    if (!text || !this.settings.readingLine) return;
    this.speak(text, 0.8);
  }

  speakHoverText(text) {
    if (!text || !this.settings.hoverSpeech) return;
    this.speak(text, 0.7);
  }

  speak(text, volume = 0.8) {
    if (!text || !("speechSynthesis" in window)) return;

    // Ограничение длины текста
    if (text.length > 150) {
      text = text.substring(0, 150) + "...";
    }

    this.stopSpeech();

    this.currentUtterance = new SpeechSynthesisUtterance(text);
    this.currentUtterance.lang = "ru-RU";
    this.currentUtterance.rate = this.settings.speechRate || 1.0;
    this.currentUtterance.pitch = 1.0;
    this.currentUtterance.volume = volume * (this.settings.speechVolume || 0.8);

    this.currentUtterance.onend = () => {
      this.isSpeaking = false;
    };

    this.currentUtterance.onerror = (event) => {
      console.warn("Ошибка озвучки:", event.error);
      this.isSpeaking = false;
    };

    this.isSpeaking = true;
    speechSynthesis.speak(this.currentUtterance);
  }

  stopSpeech() {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel();
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  // ============ Управление панелью ============

  openPanel() {
    const panel =
      this.cachedElements?.panel || document.querySelector(this.config.panel);

    if (panel) {
      // Сохраняем текущий фокус
      this.focusManager.previousFocus = document.activeElement;

      panel.classList.add("active");
      document.body.classList.add("accessibility-panel-open");

      // Установка фокуса в панель
      requestAnimationFrame(() => {
        const firstFocusable = this.getFocusableElements(panel)[0];
        if (firstFocusable) {
          firstFocusable.focus();
        } else {
          panel.focus();
        }
      });

      // Ловушка фокуса
      this.setupFocusTrap(panel);

      this.announce(
        "Панель доступности открыта. Используйте Tab для навигации, Escape для закрытия."
      );
    }
  }

  closePanel() {
    const panel =
      this.cachedElements?.panel || document.querySelector(this.config.panel);

    if (panel) {
      panel.classList.remove("active");
      document.body.classList.remove("accessibility-panel-open");

      // Убираем ловушку фокуса
      this.removeFocusTrap();

      // Возвращаем фокус
      if (this.focusManager.previousFocus) {
        this.focusManager.previousFocus.focus();
      } else {
        const triggerBtn = document.querySelector(
          ".floating-accessibility-btn, .accessibility-toggle"
        );
        if (triggerBtn) triggerBtn.focus();
      }

      this.announce("Панель доступности закрыта");
    }
  }

  setupFocusTrap(panel) {
    this.focusManager.trapElement = panel;

    // Сохраняем фокусируемые элементы
    this.focusManager.focusableElements = this.getFocusableElements(panel);
  }

  removeFocusTrap() {
    this.focusManager.trapElement = null;
    this.focusManager.focusableElements = [];
  }

  isPanelOpen() {
    const panel = document.querySelector(this.config.panel);
    return panel && panel.classList.contains("active");
  }

  // ============ Сохранение и восстановление настроек ============

  saveSettings() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      try {
        const settingsData = {
          settings: this.settings,
          timestamp: Date.now(),
          version: "3.2",
        };
        localStorage.setItem(
          "accessibilitySettings",
          JSON.stringify(settingsData)
        );
      } catch (error) {
        console.warn("Не удалось сохранить настройки:", error);
      }
    }, 500);
  }

  restoreSettings() {
    try {
      const saved = localStorage.getItem("accessibilitySettings");
      if (saved) {
        const data = JSON.parse(saved);
        const settings = data.settings || data;

        if (this.validateSettings(settings)) {
          Object.assign(this.settings, settings);
          this.applyAllSettings();
        }
      }
    } catch (error) {
      console.warn("Не удалось восстановить настройки:", error);
    }
  }

  validateSettings(settings) {
    const requiredKeys = ["customFontSize", "contrast", "lineHeight"];
    return requiredKeys.every((key) => key in settings);
  }

  applyAllSettings() {
    // Применяем все настройки
    this.handleTextSize(this.settings.customFontSize);
    this.setContrast(this.settings.contrast);
    this.handleLineHeight(this.settings.lineHeight);
    this.handleLetterSpacing(this.settings.letterSpacing);
    this.handleWordSpacing(this.settings.wordSpacing);
    this.handleCursorSize(this.settings.cursorSize);
    this.handleAnimationSpeed(this.settings.animationSpeed);
    this.handleFocusEffect(this.settings.focusEffect);

    // Применяем переключатели
    this.handleUnderlineLinks(this.settings.underlineLinks);
    this.handleHighlightHeadings(this.settings.highlightHeadings);
    this.handleHighlightLinks(this.settings.highlightLinks);
    this.handleScrollBehavior(this.settings.scrollBehavior);
    this.handleHideImages(this.settings.hideImages);
    this.handleKeyboardNav(this.settings.keyboardNav);
    this.handleDyslexia(this.settings.dyslexia);

    if (this.settings.readingLine) this.enableReadingLine();
    if (this.settings.hoverSpeech) this.enableHoverSpeech();

    // Обновляем UI
    this.updateUIElements();
  }

  updateUIElements() {
    // Обновляем ползунки
    const sliders = [
      { id: "textSizeSlider", value: this.settings.customFontSize },
      { id: "lineHeightSlider", value: this.settings.lineHeight },
      { id: "letterSpacingSlider", value: this.settings.letterSpacing },
      { id: "wordSpacingSlider", value: this.settings.wordSpacing },
      { id: "cursorSizeSlider", value: this.settings.cursorSize },
      { id: "animationSpeedSlider", value: this.settings.animationSpeed },
      { id: "focusEffectSlider", value: this.settings.focusEffect },
      { id: "speechRateSlider", value: this.settings.speechRate },
      { id: "speechVolumeSlider", value: this.settings.speechVolume },
    ];

    sliders.forEach(({ id, value }) => {
      const slider = document.getElementById(id);
      if (slider) {
        slider.value = value;
        slider.dispatchEvent(new Event("input"));
      }
    });

    // Обновляем переключатели
    const toggles = [
      { id: "underlineLinksToggle", value: this.settings.underlineLinks },
      { id: "highlightHeadingsToggle", value: this.settings.highlightHeadings },
      { id: "highlightLinksToggle", value: this.settings.highlightLinks },
      { id: "scrollBehaviorToggle", value: this.settings.scrollBehavior },
      { id: "readingLineToggle", value: this.settings.readingLine },
      { id: "hoverSpeechToggle", value: this.settings.hoverSpeech },
      { id: "hideImagesToggle", value: this.settings.hideImages },
      { id: "keyboardNavToggle", value: this.settings.keyboardNav },
      { id: "dyslexiaToggle", value: this.settings.dyslexia },
    ];

    toggles.forEach(({ id, value }) => {
      const toggle = document.getElementById(id);
      if (toggle) {
        toggle.checked = value === 1;
        this.updateToggleStatus(id, value === 1);
      }
    });

    // Обновляем кнопки контраста
    document.querySelectorAll(".contrast-btn").forEach((btn) => {
      btn.classList.toggle(
        "active",
        btn.dataset.contrast === this.settings.contrast
      );
    });
  }

  resetSettings() {
    // Отключаем активные функции
    this.disableReadingLine();
    this.disableHoverSpeech();

    // Сброс настроек
    this.settings = {
      customFontSize: 1.0,
      contrast: "normal",
      lineHeight: 1.6,
      letterSpacing: 0,
      wordSpacing: 0,
      fontFamily: "system-ui",
      underlineLinks: 0,
      highlightHeadings: 0,
      highlightLinks: 0,
      cursorSize: 1,
      animationSpeed: 1,
      focusEffect: 1,
      scrollBehavior: 0,
      readingLine: 0,
      hoverSpeech: 0,
      speechRate: 1.0,
      speechVolume: 0.8,
      hideImages: 0,
      keyboardNav: 0,
      dyslexia: 0,
      reducedMotion: this.settings.reducedMotion, // Сохраняем системную настройку
    };

    // Удаляем классы цветовых схем
    const colorSchemes = [
      "high-contrast",
      "dark-theme",
      "inverted-colors",
      "sepia",
      "blue-light",
      "green-calm",
    ];

    colorSchemes.forEach((scheme) => {
      document.body.classList.remove(`${scheme}-enabled`);
      document.documentElement.classList.remove(`${scheme}-enabled`);
    });

    // Удаляем все классы доступности
    const classesToRemove = [
      "cursor-large-enabled",
      "cursor-extra-large-enabled",
      "animation-slow-enabled",
      "animation-disabled-enabled",
      "focus-enhanced-enabled",
      "focus-strong-enabled",
      "smooth-scroll-enabled",
      "hide-images-enabled",
      "keyboard-navigation-enabled",
      "dyslexia-mode-enabled",
      "underline-links-enabled",
      "enhanced-headings-enabled",
      "enhanced-links-enabled",
      "high-contrast-enabled",
      "dark-theme-enabled",
      "inverted-colors-enabled",
      "sepia-enabled",
      "blue-light-enabled",
      "green-calm-enabled",
    ];

    classesToRemove.forEach((className) => {
      document.body.classList.remove(className);
    });

    // Сброс стилей контента
    if (this.contentEl) {
      this.contentEl.style.fontSize = "";
      this.contentEl.style.lineHeight = "";
      this.contentEl.style.letterSpacing = "";
      this.contentEl.style.wordSpacing = "";
      this.contentEl.style.fontFamily = "";
    }

    this.applyAllSettings();
    this.saveSettings();
    this.announce("Все настройки сброшены к значениям по умолчанию");
  }

  saveProfile() {
    try {
      const profileData = {
        settings: this.settings,
        timestamp: new Date().toISOString(),
        version: "3.2",
      };

      const blob = new Blob([JSON.stringify(profileData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `accessibility-profile-${
        new Date().toISOString().split("T")[0]
      }.json`;
      a.setAttribute("aria-label", "Скачать профиль доступности");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      this.announce("Профиль доступности сохранен");
    } catch (error) {
      console.error("Ошибка сохранения профиля:", error);
      this.announce("Ошибка при сохранении профиля");
    }
  }

  loadProfile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.setAttribute("aria-label", "Выберите файл профиля доступности");

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const profileData = JSON.parse(e.target.result);

          if (profileData.settings) {
            Object.assign(this.settings, profileData.settings);
            this.applyAllSettings();
            this.saveSettings();
            this.announce("Профиль доступности загружен");
          } else {
            throw new Error("Неверный формат файла");
          }
        } catch (error) {
          console.error("Ошибка загрузки профиля:", error);
          this.announce("Ошибка при загрузке профиля");
        }
      };
      reader.readAsText(file);
    };

    input.click();
  }

  announce(message) {
    const announcer = document.querySelector(this.config.announcer);
    if (announcer) {
      announcer.textContent = message;

      // Очистка через 5 секунд
      setTimeout(() => {
        if (announcer.textContent === message) {
          announcer.textContent = "";
        }
      }, 5000);
    }

    // Также выводим в консоль для отладки
    console.log("Accessibility Announcement:", message);
  }
}

// Глобальная инициализация с улучшенной обработкой ошибок
(function () {
  "use strict";

  let panelInstance = null;
  let isInitialized = false;

  function initializePanel() {
    if (isInitialized) return panelInstance;

    try {
      // Проверяем, есть ли необходимые DOM элементы
      if (!document.querySelector(".accessibility-panel")) {
        console.warn("Панель доступности не найдена в DOM");
        return null;
      }

      panelInstance = new AccessibilityPanel();
      isInitialized = true;

      // Глобальный обработчик ошибок для панели
      window.addEventListener("error", (event) => {
        if (event.filename && event.filename.includes("accessibility")) {
          console.error("Ошибка в панели доступности:", event.error);
          if (panelInstance) {
            panelInstance.announce(
              "Произошла ошибка в работе панели доступности"
            );
          }
        }
      });

      return panelInstance;
    } catch (error) {
      console.error(
        "Критическая ошибка инициализации панели доступности:",
        error
      );
      return null;
    }
  }

  // Отложенная инициализация
  function lazyInitialize() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initializePanel);
    } else {
      // Небольшая задержка для гарантии загрузки DOM
      setTimeout(initializePanel, 100);
    }
  }

  // Глобальный доступ к панели
  window.accessibilityPanel = {
    getInstance: () => panelInstance || initializePanel(),
    isReady: () => isInitialized,
    init: lazyInitialize,
  };

  // Автоматическая инициализация
  lazyInitialize();
})();
