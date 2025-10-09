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

// Глобальная инициализация с улучшенной обработкой ошибок
(function () {
    'use strict';

    let panelInstance = null;
    let isInitialized = false;

    function initializePanel() {
        if (isInitialized) return panelInstance;

        try {
            // Проверяем, есть ли необходимые DOM элементы
            if (!document.querySelector('.accessibility-panel')) {
                console.warn('Панель доступности не найдена в DOM');
                return null;
            }

            panelInstance = new AccessibilityPanel();
            isInitialized = true;
            
            // Глобальный обработчик ошибок для панели
            window.addEventListener('error', (event) => {
                if (event.filename && event.filename.includes('accessibility')) {
                    console.error('Ошибка в панели доступности:', event.error);
                    if (panelInstance) {
                        panelInstance.announce('Произошла ошибка в работе панели доступности');
                    }
                }
            });

            return panelInstance;
        } catch (error) {
            console.error('Критическая ошибка инициализации панели доступности:', error);
            return null;
        }
    }

    // Отложенная инициализация
    function lazyInitialize() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializePanel);
        } else {
            // Небольшая задержка для гарантии загрузки DOM
            setTimeout(initializePanel, 100);
        }
    }

    // Глобальный доступ к панели
    window.accessibilityPanel = {
        getInstance: () => panelInstance || initializePanel(),
        isReady: () => isInitialized,
        init: lazyInitialize
    };

    // Автоматическая инициализация
    lazyInitialize();
})();