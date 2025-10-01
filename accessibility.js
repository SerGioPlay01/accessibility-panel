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
        this.config = Object.assign({
            panel: '#accessibilityPanel',
            overlay: '#accessibilityOverlay',
            floatingBtn: '.floating-accessibility-btn',
            headerBtn: '.accessibility-toggle',
            closeBtn: '.close-panel',
            announcer: '#sr-announcements',
            textSlider: '#textSizeSlider',
            hideImagesToggle: '#hideImages',
            readingLineToggle: '#readingLine',
            contentWrapper: 'main' // Элемент, к которому применяются стили
        }, config);

        this.settings = {
            customFontSize: 1.0,
            contrast: 'normal',
            lineHeight: 1.5,
            letterSpacing: 0,
            wordSpacing: 0,
            fontFamily: 'inter',
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
        };

        this.contentEl = document.querySelector('.page-content') || document.querySelector(this.config.contentWrapper);
        this.readingLineEl = null;
        this.hintBox = null;
        this.readingLineHandler = null;
        this.lastHint = '';
        this.hoverSpeechHandler = null;
        this.hoverLeaveHandler = null;
        this.lastHoverText = '';


        this.init();
    }

    init() {
        try {
            // Проверка поддержки браузера
            if (!this.checkBrowserSupport()) {
                console.warn('Браузер не поддерживает все функции панели доступности');
            }

            // Оптимизированная инициализация
            this.bindEvents();
            this.restoreSettings();
            this.optimizePerformance();
            this.announce('Панель доступности загружена');

            // Добавление индикатора готовности
            document.body.classList.add('accessibility-ready', 'accessibility-enabled');
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.announce('Ошибка загрузки панели доступности');
        }
    }

    optimizePerformance() {
        // Дебаунс для ресайза окна
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.handleResize();
            }, 250);
        });

        // Оптимизация скролла
        let scrollTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                this.handleScroll();
            }, 100);
        }, { passive: true });

        // Поддержка жестов для мобильных
        this.initTouchGestures();

        // Предзагрузка критических элементов
        this.preloadCriticalElements();
    }

    handleResize() {
        // Адаптация панели под новый размер экрана
        const panel = document.querySelector(this.config.panel);
        if (panel && panel.classList.contains('active')) {
            this.adjustPanelSize();
        }
    }

    handleScroll() {
        // Оптимизация при скролле (если нужно)
        if (this.readingLineEl) {
            // Обновление позиции линейки чтения при скролле
            const rect = this.readingLineEl.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                this.readingLineEl.style.opacity = '0.5';
            } else {
                this.readingLineEl.style.opacity = '1';
            }
        }
    }

    adjustPanelSize() {
        const panel = document.querySelector(this.config.panel);
        if (!panel) return;

        // Адаптивная высота панели
        const maxHeight = window.innerHeight * 0.8;
        panel.style.maxHeight = maxHeight + 'px';
    }

    initTouchGestures() {
        const panel = document.querySelector(this.config.panel);
        if (!panel) return;

        let startY = 0;
        let currentY = 0;
        let isDragging = false;

        panel.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        }, { passive: true });

        panel.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;

            // Если свайп вниз больше 100px, закрываем панель
            if (deltaY > 100) {
                this.closePanel();
                isDragging = false;
            }
        }, { passive: true });

        panel.addEventListener('touchend', () => {
            isDragging = false;
        }, { passive: true });
    }

    preloadCriticalElements() {
        // Предзагрузка часто используемых элементов
        this.cachedElements = {
            panel: document.querySelector(this.config.panel),
            overlay: document.querySelector(this.config.overlay),
            content: document.querySelector('.accessibility-content'),
            announcer: document.querySelector(this.config.announcer)
        };
    }

    checkBrowserSupport() {
        const features = {
            speechSynthesis: 'speechSynthesis' in window,
            localStorage: 'localStorage' in window,
            classList: 'classList' in document.createElement('div'),
            addEventListener: 'addEventListener' in window
        };

        const unsupported = Object.entries(features)
            .filter(([feature, supported]) => !supported)
            .map(([feature]) => feature);

        if (unsupported.length > 0) {
            console.warn('Неподдерживаемые функции:', unsupported);
            return false;
        }

        return true;
    }

    bindEvents() {
        const cfg = this.config;

        this.safeBind(cfg.floatingBtn, 'click', () => this.openPanel());
        this.safeBind(cfg.headerBtn, 'click', () => this.openPanel());
        this.safeBind(cfg.closeBtn, 'click', () => this.closePanel());
        this.safeBind(cfg.overlay, 'click', () => this.closePanel());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isPanelOpen()) this.closePanel();
        });

        // Ползунок размера текста
        const slider = document.querySelector(cfg.textSlider);
        if (slider) {
            slider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                this.setCustomFontSize(value);
            });
        }

        // Инициализация всех ползунков
        this.initializeSliders();

        // Инициализация переключателей
        this.initializeToggles();

        // Привязка кнопок
        this.bindActionButtons('.contrast-btn', (btn) => this.setContrast(btn.dataset.contrast));

        this.bindSelect('#lineHeight', (val) => this.setLineHeight(val));
        this.bindSelect('#letterSpacing', (val) => this.setLetterSpacing(val));
        this.bindSelect('#fontFamily', (val) => this.setFontFamily(val));

        // Озвучка при наведении
        const hoverSpeech = document.querySelector('#hoverSpeech');
        if (hoverSpeech) {
            hoverSpeech.addEventListener('change', (e) => {
                this.settings.hoverSpeech = e.target.checked;
                if (e.target.checked) this.enableHoverSpeech();
                else this.disableHoverSpeech();
                this.saveSettings();
            });
        }

        this.bindToggles([
            'underlineLinks', 'highlightHeadings', 'highlightLinks', 'pauseAnimations',
            'readingGuide', 'readingMask', 'bigCursor', 'keyboardNavigation'
        ]);

        this.safeBind('.reset-btn', 'click', () => this.resetSettings());
        this.safeBind('.save-profile-btn', 'click', () => this.saveProfile());
        this.safeBind('.load-profile-btn', 'click', () => this.loadProfile());
    }

    bindActionButtons(selector, callback) {
        document.querySelectorAll(selector)?.forEach(btn => {
            btn.addEventListener('click', () => callback(btn));
        });
    }

    bindSelect(selector, callback) {
        const el = document.querySelector(selector);
        if (el) el.addEventListener('change', (e) => callback(e.target.value));
    }

    bindToggles(toggles) {
        toggles.forEach(toggle => {
            const el = document.getElementById(toggle);
            if (el) {
                el.addEventListener('change', (e) => {
                    this.settings[toggle] = e.target.checked;
                    this.applyToggleSetting(toggle, e.target.checked);
                    this.saveSettings();
                });
            }
        });
    }

    safeBind(selector, event, handler) {
        const el = document.querySelector(selector);
        if (el) el.addEventListener(event, handler);
    }

    updateSliderTrack(slider, value) {
        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);
        const percentage = ((value - min) / (max - min)) * 100;

        // Обновляем CSS переменную для трека
        slider.style.setProperty('--value', `${percentage}%`);
        
        // Добавляем анимацию при изменении
        slider.classList.add('updating');
        setTimeout(() => {
            slider.classList.remove('updating');
        }, 300);

        // Улучшенный градиент с плавными переходами
        const activeColor = '#4A90E2';
        const inactiveColor = '#e9ecef';
        slider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${inactiveColor} ${percentage}%, ${inactiveColor} 100%)`;
    }

    updateToggleStatus(toggleId, isActive) {
        const toggle = document.getElementById(toggleId);
        const label = toggle?.closest('.toggle-label');

        if (label) {
            if (isActive) {
                label.classList.add('active');
            } else {
                label.classList.remove('active');
            }
        }
    }

    initializeToggles() {
        const toggles = [
            { id: 'underlineLinksToggle', handler: this.handleUnderlineLinks.bind(this) },
            { id: 'highlightHeadingsToggle', handler: this.handleHighlightHeadings.bind(this) },
            { id: 'highlightLinksToggle', handler: this.handleHighlightLinks.bind(this) },
            { id: 'scrollBehaviorToggle', handler: this.handleScrollBehavior.bind(this) },
            { id: 'readingLineToggle', handler: this.handleReadingLine.bind(this) },
            { id: 'hoverSpeechToggle', handler: this.handleHoverSpeech.bind(this) },
            { id: 'hideImagesToggle', handler: this.handleHideImages.bind(this) },
            { id: 'keyboardNavToggle', handler: this.handleKeyboardNav.bind(this) },
            { id: 'dyslexiaToggle', handler: this.handleDyslexia.bind(this) }
        ];

        toggles.forEach(({ id, handler }) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    const value = e.target.checked ? 1 : 0;
                    handler(value);
                });
            }
        });
    }

    initializeSliders() {
        const sliders = [
            { id: 'lineHeightSlider', handler: this.handleLineHeight.bind(this), format: (v) => v, type: 'level' },
            { id: 'letterSpacingSlider', handler: this.handleLetterSpacing.bind(this), format: (v) => v + 'px', type: 'pixels' },
            { id: 'wordSpacingSlider', handler: this.handleWordSpacing.bind(this), format: (v) => v + 'px', type: 'pixels' },
            { id: 'cursorSizeSlider', handler: this.handleCursorSize.bind(this), format: (v) => ['Обычный', 'Большой', 'Очень большой'][v - 1], type: 'level' },
            { id: 'animationSpeedSlider', handler: this.handleAnimationSpeed.bind(this), format: (v) => ['Выкл', 'Медленная', 'Обычная', 'Быстрая'][v * 2], type: 'level' },
            { id: 'focusEffectSlider', handler: this.handleFocusEffect.bind(this), format: (v) => ['Выкл', 'Обычный', 'Усиленный'][v], type: 'level' },
            { id: 'speechRateSlider', handler: this.handleSpeechRate.bind(this), format: (v) => v + 'x', type: 'multiplier' },
            { id: 'speechVolumeSlider', handler: this.handleSpeechVolume.bind(this), format: (v) => Math.round(v * 100) + '%', type: 'percentage' },

        ];

        sliders.forEach(({ id, handler, format, type }) => {
            const slider = document.getElementById(id);
            const valueDisplay = slider?.parentElement.querySelector('.slider-value');

            if (slider && valueDisplay) {
                // Установка типа данных для стилизации
                if (type) {
                    valueDisplay.setAttribute('data-type', type);
                }

                // Обновление значения при изменении
                slider.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);

                    // Плавная анимация обновления
                    valueDisplay.classList.add('updating');
                    setTimeout(() => {
                        valueDisplay.classList.remove('updating');
                    }, 400);

                    const formattedValue = format(value);
                    
                    // Плавное обновление текста
                    valueDisplay.style.opacity = '0.7';
                    setTimeout(() => {
                        valueDisplay.textContent = formattedValue;
                        valueDisplay.style.opacity = '1';
                    }, 100);

                    // Добавление класса для длинных текстов
                    if (formattedValue.length > 8) {
                        valueDisplay.classList.add('long-text');
                    } else {
                        valueDisplay.classList.remove('long-text');
                    }

                    this.updateSliderTrack(slider, value);
                    handler(value);
                });

                // Добавляем обработчики для улучшенной интерактивности
                slider.addEventListener('mousedown', () => {
                    slider.classList.add('dragging');
                });

                slider.addEventListener('mouseup', () => {
                    slider.classList.remove('dragging');
                });

                slider.addEventListener('mouseleave', () => {
                    slider.classList.remove('dragging');
                });

                // Инициализация начального значения
                const initialValue = parseFloat(slider.value);
                const initialFormattedValue = format(initialValue);
                valueDisplay.textContent = initialFormattedValue;

                // Добавление класса для длинных текстов при инициализации
                if (initialFormattedValue.length > 8) {
                    valueDisplay.classList.add('long-text');
                }

                this.updateSliderTrack(slider, initialValue);
            }
        });
    }

    // ============ Обработчики ползунков ============

    handleLineHeight(value) {
        if (this.contentEl) this.contentEl.style.lineHeight = value;
        this.settings.lineHeight = value;
        this.saveSettings();
        this.announce(`Межстрочный интервал: ${value}`);
    }

    handleLetterSpacing(value) {
        if (this.contentEl) this.contentEl.style.letterSpacing = value + 'px';
        this.settings.letterSpacing = value;
        this.saveSettings();
        this.announce(`Межбуквенный интервал: ${value}px`);
    }

    handleWordSpacing(value) {
        if (this.contentEl) this.contentEl.style.wordSpacing = value + 'px';
        this.settings.wordSpacing = value;
        this.saveSettings();
        this.announce(`Отступы между словами: ${value}px`);
    }

    handleUnderlineLinks(value) {
        document.body.classList.toggle('underline-links-enabled', value === 1);
        this.updateToggleStatus('underlineLinksToggle', value === 1);
        this.settings.underlineLinks = value;
        this.saveSettings();
        this.announce(`Подчеркивание ссылок: ${value ? 'включено' : 'выключено'}`);
    }

    handleHighlightHeadings(value) {
        document.body.classList.toggle('enhanced-headings-enabled', value === 1);
        this.updateToggleStatus('highlightHeadingsToggle', value === 1);
        this.settings.highlightHeadings = value;
        this.saveSettings();
        this.announce(`Выделение заголовков: ${value ? 'включено' : 'выключено'}`);
    }

    handleHighlightLinks(value) {
        document.body.classList.toggle('enhanced-links-enabled', value === 1);
        this.updateToggleStatus('highlightLinksToggle', value === 1);
        this.settings.highlightLinks = value;
        this.saveSettings();
        this.announce(`Выделение ссылок: ${value ? 'включено' : 'выключено'}`);
    }

    handleCursorSize(value) {
        // Удаляем все классы курсора
        document.body.classList.remove('cursor-large-enabled', 'cursor-extra-large-enabled');

        // Применяем новый размер курсора
        switch (value) {
            case 1:
                // Обычный курсор - ничего не добавляем
                break;
            case 2:
                document.body.classList.add('cursor-large-enabled');
                break;
            case 3:
                document.body.classList.add('cursor-extra-large-enabled');
                break;
        }

        this.settings.cursorSize = value;
        this.saveSettings();

        const cursorNames = ['Обычный', 'Большой', 'Очень большой'];
        this.announce(`Размер курсора: ${cursorNames[value - 1]}`);
    }

    handleAnimationSpeed(value) {
        document.body.classList.remove('animation-slow-enabled', 'animation-disabled-enabled');
        if (value === 0) document.body.classList.add('animation-disabled-enabled');
        if (value === 0.5) document.body.classList.add('animation-slow-enabled');
        this.settings.animationSpeed = value;
        this.saveSettings();
        this.announce(`Скорость анимаций изменена`);
    }

    handleFocusEffect(value) {
        document.body.classList.remove('focus-enhanced-enabled', 'focus-strong-enabled');
        if (value === 1) document.body.classList.add('focus-enhanced-enabled');
        if (value === 2) document.body.classList.add('focus-strong-enabled');
        this.settings.focusEffect = value;
        this.saveSettings();
        this.announce(`Эффект фокуса изменен`);
    }

    handleScrollBehavior(value) {
        document.body.classList.toggle('smooth-scroll-enabled', value === 1);
        this.updateToggleStatus('scrollBehaviorToggle', value === 1);
        this.settings.scrollBehavior = value;
        this.saveSettings();
        this.announce(`Плавная прокрутка: ${value ? 'включена' : 'выключена'}`);
    }

    handleReadingLine(value) {
        this.updateToggleStatus('readingLineToggle', value === 1);
        this.settings.readingLine = value;
        if (value === 1) this.enableReadingLine();
        else this.disableReadingLine();
        this.saveSettings();
    }

    handleHoverSpeech(value) {
        this.updateToggleStatus('hoverSpeechToggle', value === 1);
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
        document.body.classList.toggle('hide-images-enabled', value === 1);
        this.updateToggleStatus('hideImagesToggle', value === 1);
        this.settings.hideImages = value;
        this.saveSettings();
        this.announce(`Режим без изображений: ${value ? 'включен' : 'выключен'}`);
    }

    handleKeyboardNav(value) {
        document.body.classList.toggle('keyboard-navigation-enabled', value === 1);
        this.updateToggleStatus('keyboardNavToggle', value === 1);
        this.settings.keyboardNav = value;
        this.saveSettings();
        this.announce(`Клавиатурная навигация: ${value ? 'включена' : 'выключена'}`);
    }

    handleDyslexia(value) {
        document.body.classList.toggle('dyslexia-mode-enabled', value === 1);
        this.updateToggleStatus('dyslexiaToggle', value === 1);
        this.settings.dyslexia = value;
        this.saveSettings();
        this.announce(`Режим дислексии: ${value ? 'включен' : 'выключен'}`);
    }



    // ============ Стили только для контента ============

    setCustomFontSize(value) {
        if (this.contentEl) this.contentEl.style.fontSize = value + 'em';
        this.settings.customFontSize = value;

        // Обновление отображения значения
        const slider = document.getElementById('textSizeSlider');
        const valueDisplay = slider?.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
            valueDisplay.setAttribute('data-type', 'percentage');
            valueDisplay.classList.add('updating');
            setTimeout(() => {
                valueDisplay.classList.remove('updating');
            }, 300);

            const formattedValue = Math.round(value * 100) + '%';
            valueDisplay.textContent = formattedValue;

            // Добавление класса для длинных текстов
            if (formattedValue.length > 8) {
                valueDisplay.classList.add('long-text');
            } else {
                valueDisplay.classList.remove('long-text');
            }
        }
        if (slider) {
            this.updateSliderTrack(slider, value);
        }

        this.saveSettings();
        this.announce(`Размер текста изменен: ${Math.round(value * 100)}%`);
    }



    setContrast(type) {
        // Удаляем все цветовые схемы
        const colorSchemes = [
            'high-contrast-enabled', 'dark-theme-enabled', 'inverted-colors-enabled',
            'sepia-enabled', 'blue-light-enabled', 'green-calm-enabled'
        ];

        colorSchemes.forEach(scheme => {
            document.body.classList.remove(scheme);
        });

        // Применяем выбранную схему
        switch (type) {
            case 'high':
                document.body.classList.add('high-contrast-enabled');
                break;
            case 'dark':
                document.body.classList.add('dark-theme-enabled');
                break;
            case 'inverted':
                document.body.classList.add('inverted-colors-enabled');
                break;
            case 'sepia':
                document.body.classList.add('sepia-enabled');
                break;
            case 'blue-light':
                document.body.classList.add('blue-light-enabled');
                break;
            case 'green-calm':
                document.body.classList.add('green-calm-enabled');
                break;
        }

        this.settings.contrast = type;
        this.saveSettings();

        const schemeNames = {
            'normal': 'Обычная',
            'high': 'Высокий контраст',
            'dark': 'Тёмная тема',
            'inverted': 'Инверсия цветов',
            'sepia': 'Сепия',
            'blue-light': 'Синий свет',
            'green-calm': 'Зелёная схема'
        };

        this.announce(`Цветовая схема: ${schemeNames[type] || type}`);
    }

    setLineHeight(value) {
        if (this.contentEl) this.contentEl.style.lineHeight = value;
        this.settings.lineHeight = value;
        this.saveSettings();
    }

    setLetterSpacing(value) {
        if (this.contentEl) this.contentEl.style.letterSpacing = value;
        this.settings.letterSpacing = value;
        this.saveSettings();
    }

    setFontFamily(value) {
        if (this.contentEl) this.contentEl.style.fontFamily = value;
        this.settings.fontFamily = value;
        this.saveSettings();
    }

    applyHideImages(enabled) {
        if (!this.contentEl) return;
        if (enabled) {
            this.contentEl.classList.add('hide-images');
            this.announce('Режим без картинок включен');
        } else {
            this.contentEl.classList.remove('hide-images');
            this.announce('Режим без картинок выключен');
        }
    }

    applyToggleSetting(toggle, enabled) {
        if (!this.contentEl) return;
        switch (toggle) {
            case 'underlineLinks':
                this.contentEl.classList.toggle('underline-links', enabled); break;
            case 'highlightHeadings':
                this.contentEl.classList.toggle('highlight-headings', enabled); break;
            case 'highlightLinks':
                this.contentEl.classList.toggle('highlight-links', enabled); break;
            case 'pauseAnimations':
                this.contentEl.classList.toggle('pause-animations', enabled); break;
            case 'bigCursor':
                this.contentEl.classList.toggle('big-cursor', enabled); break;
        }
    }

    // ============ Панель и линейка остаются как есть ============

    enableReadingLine() {
        if (this.readingLineEl) return;

        // Создание линейки чтения
        this.readingLineEl = document.createElement('div');
        Object.assign(this.readingLineEl.style, {
            position: 'absolute',
            left: '0',
            width: '100%',
            height: '1.6em',
            background: 'rgba(0, 150, 255, 0.15)',
            border: '1px solid rgba(0, 150, 255, 0.3)',
            pointerEvents: 'none',
            zIndex: '999999',
            transition: 'top 0.1s ease'
        });
        document.body.appendChild(this.readingLineEl);

        // Создание подсказки
        this.hintBox = document.createElement('div');
        Object.assign(this.hintBox.style, {
            position: 'fixed',
            background: 'linear-gradient(135deg, #2c5aa0, #4a90e2)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            pointerEvents: 'none',
            zIndex: '1000000',
            display: 'none',
            maxWidth: '300px',
            wordWrap: 'break-word',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
        });
        document.body.appendChild(this.hintBox);

        // Обработчик движения мыши с дебаунсом
        let debounceTimer;
        document.addEventListener('mousemove', this.readingLineHandler = (e) => {
            // Обновление позиции линейки
            const lineHeight = parseFloat(getComputedStyle(this.contentEl || document.body).lineHeight) || 24;
            const y = e.clientY - (lineHeight / 2);
            this.readingLineEl.style.top = (window.scrollY + y) + 'px';

            // Дебаунс для оптимизации
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                const el = document.elementFromPoint(e.clientX, e.clientY);
                this.handleElementHover(el, e.clientX, e.clientY);
            }, 50);
        });

        this.announce('Линейка чтения включена');
    }

    handleElementHover(el, clientX, clientY) {
        if (!el || !this.hintBox) return;

        // Получение текста элемента
        let text = this.getElementText(el);

        if (text && text.length > 0) {
            // Ограничение длины текста
            const maxWords = 15;
            const words = text.split(/\s+/);
            if (words.length > maxWords) {
                text = words.slice(0, maxWords).join(' ') + '...';
            }

            // Обновление подсказки
            this.hintBox.textContent = text;

            // Позиционирование подсказки
            const offset = 15;
            let left = clientX + offset;
            let top = clientY + offset;

            // Проверка границ экрана
            const hintRect = this.hintBox.getBoundingClientRect();
            if (left + 300 > window.innerWidth) {
                left = clientX - 300 - offset;
            }
            if (top + hintRect.height > window.innerHeight) {
                top = clientY - hintRect.height - offset;
            }

            this.hintBox.style.left = Math.max(10, left) + 'px';
            this.hintBox.style.top = Math.max(10, top) + 'px';
            this.hintBox.style.display = 'block';

            // Озвучка только при смене текста
            if (this.lastHint !== text) {
                this.lastHint = text;
                this.speakText(text);
            }
        } else {
            this.hintBox.style.display = 'none';
            this.lastHint = '';
        }
    }

    getElementText(el) {
        if (!el) return '';

        // Приоритет для разных типов элементов
        if (el.alt && el.tagName === 'IMG') {
            return `Изображение: ${el.alt}`;
        }

        if (el.title) {
            return el.title;
        }

        if (el.getAttribute('aria-label')) {
            return el.getAttribute('aria-label');
        }

        if (el.tagName === 'A' && el.href) {
            const linkText = el.innerText?.trim() || el.textContent?.trim();
            return linkText ? `Ссылка: ${linkText}` : `Ссылка: ${el.href}`;
        }

        if (el.tagName === 'BUTTON') {
            const buttonText = el.innerText?.trim() || el.textContent?.trim();
            return buttonText ? `Кнопка: ${buttonText}` : 'Кнопка';
        }

        // Для заголовков
        if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
            const headingText = el.innerText?.trim() || el.textContent?.trim();
            return headingText ? `Заголовок: ${headingText}` : '';
        }

        // Обычный текст
        const text = el.innerText?.trim() || el.textContent?.trim();
        return text && text.length > 2 ? text : '';
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
            document.removeEventListener('mousemove', this.readingLineHandler);
            this.readingLineHandler = null;
        }
        this.lastHint = '';
        this.announce('Линейка чтения выключена');
    }

    enableHoverSpeech() {
        if (this.hoverSpeechHandler) return;

        // Создание обработчика наведения только для озвучки
        this.hoverSpeechHandler = (e) => {
            const el = e.target;
            if (!el || !this.contentEl?.contains(el)) return;

            const text = this.getElementText(el);
            if (text && text !== this.lastHoverText) {
                this.lastHoverText = text;
                this.speakHoverText(text);
            }
        };

        // Обработчик для сброса при уходе мыши
        this.hoverLeaveHandler = () => {
            this.lastHoverText = '';
            speechSynthesis.cancel();
        };

        if (this.contentEl) {
            this.contentEl.addEventListener('mouseover', this.hoverSpeechHandler);
            this.contentEl.addEventListener('mouseleave', this.hoverLeaveHandler);
        }

        this.announce('Озвучка при наведении включена');
    }

    disableHoverSpeech() {
        if (this.hoverSpeechHandler && this.contentEl) {
            this.contentEl.removeEventListener('mouseover', this.hoverSpeechHandler);
            this.contentEl.removeEventListener('mouseleave', this.hoverLeaveHandler);
            this.hoverSpeechHandler = null;
            this.hoverLeaveHandler = null;
        }
        this.lastHoverText = '';
        speechSynthesis.cancel();
        this.announce('Озвучка при наведении выключена');
    }

    speakHoverText(text) {
        if (!text || !('speechSynthesis' in window) || !this.settings.hoverSpeech) return;

        // Ограничение длины для озвучки
        if (text.length > 150) {
            text = text.substring(0, 150) + '...';
        }

        // Отмена предыдущей озвучки
        speechSynthesis.cancel();

        // Создание нового высказывания
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ru-RU";
        utterance.rate = this.settings.speechRate || 1.1;
        utterance.pitch = 1.0;
        utterance.volume = this.settings.speechVolume || 0.7;

        // Обработка ошибок
        utterance.onerror = (event) => {
            console.warn('Ошибка озвучки при наведении:', event.error);
        };

        speechSynthesis.speak(utterance);
    }



    speakText(text) {
        if (!text || !('speechSynthesis' in window) || !this.settings.readingLine) return;

        // Ограничение длины для озвучки
        if (text.length > 200) {
            text = text.substring(0, 200) + '...';
        }

        // Отмена предыдущей озвучки
        speechSynthesis.cancel();

        // Создание нового высказывания
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ru-RU";
        utterance.rate = this.settings.speechRate || 0.9;
        utterance.pitch = 1.0;
        utterance.volume = this.settings.speechVolume || 0.8;

        // Обработка ошибок
        utterance.onerror = (event) => {
            console.warn('Ошибка озвучки линейки:', event.error);
        };

        // Небольшая задержка для избежания спама
        setTimeout(() => {
            if (this.lastHint === text) { // Проверяем, что текст не изменился
                speechSynthesis.speak(utterance);
            }
        }, 150);
    }

    openPanel() {
        const panel = document.querySelector(this.config.panel);
        const overlay = document.querySelector(this.config.overlay);
        if (panel && overlay) {
            panel.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
            this.announce('Панель доступности открыта');
        }
    }

    closePanel() {
        const panel = document.querySelector(this.config.panel);
        const overlay = document.querySelector(this.config.overlay);
        if (panel && overlay) {
            panel.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
            this.announce('Панель доступности закрыта');
        }
    }

    isPanelOpen() {
        const panel = document.querySelector(this.config.panel);
        return panel && panel.classList.contains('active');
    }

    saveProfile() {
        const profileName = prompt('Введите название профиля:', `Профиль ${new Date().toLocaleDateString()}`);
        if (!profileName) return;

        const profiles = JSON.parse(localStorage.getItem('accessibilityProfiles') || '{}');
        profiles[profileName] = { ...this.settings };
        localStorage.setItem('accessibilityProfiles', JSON.stringify(profiles));
        this.announce(`Профиль "${profileName}" сохранен`);
    }

    loadProfile() {
        const profiles = JSON.parse(localStorage.getItem('accessibilityProfiles') || '{}');
        const profileNames = Object.keys(profiles);

        if (profileNames.length === 0) {
            this.announce('Нет сохраненных профилей');
            return;
        }

        const profileList = profileNames.map((name, index) => `${index + 1}. ${name}`).join('\n');
        const choice = prompt(`Выберите профиль для загрузки:\n${profileList}\n\nВведите номер профиля:`);

        if (!choice) return;

        const profileIndex = parseInt(choice) - 1;
        const selectedProfile = profileNames[profileIndex];

        if (selectedProfile && profiles[selectedProfile]) {
            this.settings = { ...this.settings, ...profiles[selectedProfile] };
            this.applyAllSettings();
            this.saveSettings();
            this.announce(`Профиль "${selectedProfile}" загружен`);
        } else {
            this.announce('Неверный выбор профиля');
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Ошибка сохранения настроек:', e);
        }
    }

    restoreSettings() {
        const saved = localStorage.getItem('accessibilitySettings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
            this.applyAllSettings();
        }
    }

    applyAllSettings() {
        // Применение всех настроек
        if (this.settings.customFontSize) this.setCustomFontSize(this.settings.customFontSize);

        // Применение стилей текста
        this.handleLineHeight(this.settings.lineHeight);
        this.handleLetterSpacing(this.settings.letterSpacing);
        this.handleWordSpacing(this.settings.wordSpacing);

        // Применение визуальных настроек
        this.handleUnderlineLinks(this.settings.underlineLinks);
        this.handleHighlightHeadings(this.settings.highlightHeadings);
        this.handleHighlightLinks(this.settings.highlightLinks);
        this.handleCursorSize(this.settings.cursorSize);

        // Применение анимаций и эффектов
        this.handleAnimationSpeed(this.settings.animationSpeed);
        this.handleFocusEffect(this.settings.focusEffect);
        this.handleScrollBehavior(this.settings.scrollBehavior);

        // Применение специальных возможностей
        this.handleHideImages(this.settings.hideImages);
        this.handleKeyboardNav(this.settings.keyboardNav);
        this.handleDyslexia(this.settings.dyslexia);

        if (this.settings.readingLine) this.enableReadingLine();
        if (this.settings.hoverSpeech) this.enableHoverSpeech();


        // Обновление значений ползунков и переключателей
        this.updateSliderValues();
        this.updateToggleValues();
    }

    updateSliderValues() {
        const sliderMappings = {
            'textSizeSlider': this.settings.customFontSize,
            'lineHeightSlider': this.settings.lineHeight,
            'letterSpacingSlider': this.settings.letterSpacing,
            'wordSpacingSlider': this.settings.wordSpacing,
            'cursorSizeSlider': this.settings.cursorSize,
            'animationSpeedSlider': this.settings.animationSpeed,
            'focusEffectSlider': this.settings.focusEffect,
            'speechRateSlider': this.settings.speechRate,
            'speechVolumeSlider': this.settings.speechVolume,

        };

        Object.entries(sliderMappings).forEach(([sliderId, value]) => {
            const slider = document.getElementById(sliderId);
            if (slider) {
                slider.value = value;
                // Триггер события для обновления отображаемого значения
                slider.dispatchEvent(new Event('input'));
            }
        });
    }

    updateToggleValues() {
        const toggleMappings = {
            'underlineLinksToggle': this.settings.underlineLinks,
            'highlightHeadingsToggle': this.settings.highlightHeadings,
            'highlightLinksToggle': this.settings.highlightLinks,
            'scrollBehaviorToggle': this.settings.scrollBehavior,
            'readingLineToggle': this.settings.readingLine,
            'hoverSpeechToggle': this.settings.hoverSpeech,
            'hideImagesToggle': this.settings.hideImages,
            'keyboardNavToggle': this.settings.keyboardNav,
            'dyslexiaToggle': this.settings.dyslexia
        };

        Object.entries(toggleMappings).forEach(([toggleId, value]) => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.checked = value === 1;
            }
        });
    }

    resetSettings() {
        // Отключение всех активных функций
        this.disableReadingLine();
        this.disableHoverSpeech();


        // Сброс всех настроек к значениям по умолчанию
        this.settings = {
            customFontSize: 1.0,
            contrast: 'normal',
            lineHeight: 1.5,
            letterSpacing: 0,
            wordSpacing: 0,
            fontFamily: 'inter',
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
            dyslexia: 0
        };

        // Сброс стилей контента
        if (this.contentEl) {
            this.contentEl.style.fontSize = '';
            this.contentEl.style.lineHeight = '';
            this.contentEl.style.letterSpacing = '';
            this.contentEl.style.wordSpacing = '';
            this.contentEl.style.fontFamily = '';
        }

        // Удаление всех классов доступности с body
        const classesToRemove = [
            'high-contrast-enabled', 'dark-theme-enabled', 'inverted-colors-enabled',
            'sepia-enabled', 'blue-light-enabled', 'green-calm-enabled',
            'underline-links-enabled', 'enhanced-headings-enabled', 'enhanced-links-enabled',
            'cursor-large-enabled', 'cursor-extra-large-enabled', 'animation-slow-enabled',
            'animation-disabled-enabled', 'focus-enhanced-enabled', 'focus-strong-enabled',
            'smooth-scroll-enabled', 'hide-images-enabled', 'keyboard-navigation-enabled',
            'dyslexia-mode-enabled'
        ];

        classesToRemove.forEach(className => {
            document.body.classList.remove(className);
        });

        // Сброс статусов переключателей
        document.querySelectorAll('.toggle-label').forEach(label => {
            label.classList.remove('active');
        });

        // Сброс элементов управления
        document.querySelectorAll('.font-btn, .contrast-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Обновление всех ползунков
        this.updateSliderValues();

        // Сохранение сброшенных настроек
        this.saveSettings();
        this.announce('Все настройки сброшены');
    }

    announce(msg) {
        const el = document.querySelector(this.config.announcer);
        if (el) {
            el.textContent = msg;
            setTimeout(() => { el.textContent = ''; }, 1000);
        }

        // Озвучка объявлений только если включена одна из функций озвучки
        if (this.settings.readingLine || this.settings.hoverSpeech) {
            this.speakAnnouncement(msg);
        }
    }

    speakAnnouncement(text) {
        if (!text || !('speechSynthesis' in window)) return;

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ru-RU";
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 0.9;

        speechSynthesis.speak(utterance);
    }



    // ============ Сохранение и восстановление настроек ============

    saveSettings() {
        // Дебаунс для оптимизации частых сохранений
        clearTimeout(this.saveTimer);
        this.saveTimer = setTimeout(() => {
            try {
                const settingsData = {
                    settings: this.settings,
                    timestamp: Date.now(),
                    version: '3.2'
                };
                localStorage.setItem('accessibilitySettings', JSON.stringify(settingsData));
            } catch (error) {
                console.warn('Не удалось сохранить настройки:', error);
                // Fallback: попробуем сохранить только настройки без метаданных
                try {
                    localStorage.setItem('accessibilitySettings', JSON.stringify(this.settings));
                } catch (fallbackError) {
                    console.error('Критическая ошибка сохранения:', fallbackError);
                }
            }
        }, 300);
    }

    restoreSettings() {
        try {
            const saved = localStorage.getItem('accessibilitySettings');
            if (saved) {
                const data = JSON.parse(saved);

                // Поддержка старого и нового формата
                const settings = data.settings || data;

                // Валидация настроек
                if (this.validateSettings(settings)) {
                    Object.assign(this.settings, settings);
                    this.applyAllSettings();
                } else {
                    console.warn('Настройки повреждены, используем значения по умолчанию');
                }
            }
        } catch (error) {
            console.warn('Не удалось восстановить настройки:', error);
        }
    }

    validateSettings(settings) {
        // Проверяем основные свойства настроек
        const requiredKeys = ['customFontSize', 'contrast', 'lineHeight'];
        return requiredKeys.every(key => key in settings);
    }

    applyAllSettings() {
        // Применяем все сохраненные настройки
        this.setCustomFontSize(this.settings.customFontSize);
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


        // Обновляем UI элементы
        this.updateUIElements();
    }

    updateUIElements() {
        // Обновляем ползунки
        const sliders = [
            { id: 'textSizeSlider', value: this.settings.customFontSize },
            { id: 'lineHeightSlider', value: this.settings.lineHeight },
            { id: 'letterSpacingSlider', value: this.settings.letterSpacing },
            { id: 'wordSpacingSlider', value: this.settings.wordSpacing },
            { id: 'cursorSizeSlider', value: this.settings.cursorSize },
            { id: 'animationSpeedSlider', value: this.settings.animationSpeed },
            { id: 'focusEffectSlider', value: this.settings.focusEffect },
            { id: 'speechRateSlider', value: this.settings.speechRate },
            { id: 'speechVolumeSlider', value: this.settings.speechVolume },

        ];

        sliders.forEach(({ id, value }) => {
            const slider = document.getElementById(id);
            if (slider) {
                slider.value = value;
                // Триггерим событие для обновления отображения
                slider.dispatchEvent(new Event('input'));
            }
        });

        // Обновляем переключатели
        const toggles = [
            { id: 'underlineLinksToggle', value: this.settings.underlineLinks },
            { id: 'highlightHeadingsToggle', value: this.settings.highlightHeadings },
            { id: 'highlightLinksToggle', value: this.settings.highlightLinks },
            { id: 'scrollBehaviorToggle', value: this.settings.scrollBehavior },
            { id: 'readingLineToggle', value: this.settings.readingLine },
            { id: 'hoverSpeechToggle', value: this.settings.hoverSpeech },
            { id: 'hideImagesToggle', value: this.settings.hideImages },
            { id: 'keyboardNavToggle', value: this.settings.keyboardNav },
            { id: 'dyslexiaToggle', value: this.settings.dyslexia }
        ];

        toggles.forEach(({ id, value }) => {
            const toggle = document.getElementById(id);
            if (toggle) {
                toggle.checked = value === 1;
                this.updateToggleStatus(id, value === 1);
            }
        });

        // Обновляем кнопки контраста
        document.querySelectorAll('.contrast-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.contrast === this.settings.contrast);
        });
    }

    resetSettings() {
        // Сброс к значениям по умолчанию
        this.settings = {
            customFontSize: 1.0,
            contrast: 'normal',
            lineHeight: 1.5,
            letterSpacing: 0,
            wordSpacing: 0,
            fontFamily: 'inter',
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
            dyslexia: 0
        };

        // Отключаем все активные функции
        this.disableReadingLine();
        this.disableHoverSpeech();

        // Удаляем все классы с body
        const classesToRemove = [
            'cursor-large-enabled', 'cursor-extra-large-enabled',
            'animation-slow-enabled', 'animation-disabled-enabled',
            'focus-enhanced-enabled', 'focus-strong-enabled',
            'smooth-scroll-enabled', 'hide-images-enabled',
            'keyboard-navigation-enabled', 'dyslexia-mode-enabled',
            'underline-links-enabled', 'enhanced-headings-enabled',
            'enhanced-links-enabled', 'high-contrast-enabled',
            'dark-theme-enabled', 'inverted-colors-enabled',
            'sepia-enabled', 'blue-light-enabled', 'green-calm-enabled'
        ];

        classesToRemove.forEach(className => {
            document.body.classList.remove(className);
        });

        // Сброс стилей контента
        if (this.contentEl) {
            this.contentEl.style.fontSize = '';
            this.contentEl.style.lineHeight = '';
            this.contentEl.style.letterSpacing = '';
            this.contentEl.style.wordSpacing = '';
            this.contentEl.style.fontFamily = '';
        }

        this.applyAllSettings();
        this.saveSettings();
        this.announce('Все настройки сброшены к значениям по умолчанию');
    }

    saveProfile() {
        try {
            const profileData = {
                settings: this.settings,
                timestamp: new Date().toISOString(),
                version: '3.1'
            };

            const blob = new Blob([JSON.stringify(profileData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `accessibility-profile-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.announce('Профиль доступности сохранен');
        } catch (error) {
            console.error('Ошибка сохранения профиля:', error);
            this.announce('Ошибка при сохранении профиля');
        }
    }

    loadProfile() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

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
                        this.announce('Профиль доступности загружен');
                    } else {
                        throw new Error('Неверный формат файла');
                    }
                } catch (error) {
                    console.error('Ошибка загрузки профиля:', error);
                    this.announce('Ошибка при загрузке профиля');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    // ============ Управление панелью ============

    openPanel() {
        // Используем кэшированные элементы для лучшей производительности
        const panel = this.cachedElements?.panel || document.querySelector(this.config.panel);

        if (panel) {
            // Добавляем класс с анимацией к панели
            panel.classList.add('active');
            
            // Добавляем класс к body для сдвига контента
            document.body.classList.add('accessibility-panel-open');

            // Адаптивная высота панели
            this.adjustPanelSize();

            // Оптимизированный фокус
            requestAnimationFrame(() => {
                const firstFocusable = panel.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            });

            this.announce('Панель доступности открыта');
        }
    }

    closePanel() {
        const panel = this.cachedElements?.panel || document.querySelector(this.config.panel);

        if (panel) {
            panel.classList.remove('active');
            
            // Убираем класс с body для возврата контента
            document.body.classList.remove('accessibility-panel-open');

            // Возвращаем фокус на кнопку, которая открыла панель
            const triggerBtn = document.querySelector('.floating-accessibility-btn, .accessibility-toggle');
            if (triggerBtn) {
                triggerBtn.focus();
            }

            this.announce('Панель доступности закрыта');
        }
    }

    isPanelOpen() {
        const panel = document.querySelector(this.config.panel);
        return panel && panel.classList.contains('active');
    }

    announce(message) {
        const announcer = document.querySelector(this.config.announcer);
        if (announcer) {
            announcer.textContent = message;

            // Очистка через 3 секунды
            setTimeout(() => {
                if (announcer.textContent === message) {
                    announcer.textContent = '';
                }
            }, 3000);
        }
    }
}

// Ленивая инициализация панели доступности
(function () {
    'use strict';

    let panelInstance = null;
    let isInitialized = false;

    function initializePanel() {
        if (isInitialized) return panelInstance;

        try {
            panelInstance = new AccessibilityPanel();
            isInitialized = true;
            return panelInstance;
        } catch (error) {
            console.error('Ошибка инициализации панели доступности:', error);
            return null;
        }
    }

    // Инициализация при загрузке DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializePanel);
    } else {
        initializePanel();
    }

    // Глобальный доступ к панели
    window.accessibilityPanel = {
        getInstance: () => panelInstance || initializePanel(),
        isReady: () => isInitialized
    };

    // Обработка ошибок на уровне окна
    window.addEventListener('error', (event) => {
        if (event.filename && event.filename.includes('accessibility')) {
            console.error('Ошибка в панели доступности:', event.error);
        }
    });
})();
