"use strict";

/* =========================================================
   RaPrint — MAIN JAVASCRIPT
   Версия с отправкой заявок на сервер → Telegram
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =====================================================
       ELEMENTS
    ===================================================== */

    const body = document.body;

    const themeToggle =
        document.getElementById("themeToggle");

    const mobileMenuButton =
        document.getElementById("mobileMenuButton");

    const navigation =
        document.getElementById("navigation");

    const orderForm =
        document.getElementById("orderForm");

    const orderSubmit =
        document.getElementById("orderSubmit");

    const orderSubmitText =
        document.getElementById("orderSubmitText");

    const orderSubmitArrow =
        document.getElementById("orderSubmitArrow");

    const orderResult =
        document.getElementById("orderResult");

    const header =
        document.querySelector(".header");


    /* =====================================================
       THEME
    ===================================================== */

    const savedTheme =
        localStorage.getItem("raprint-theme");

    if (savedTheme === "light") {

        body.classList.add("light-theme");

    } else if (savedTheme === "dark") {

        body.classList.remove("light-theme");

    } else {

        const prefersLight =
            window.matchMedia &&
            window.matchMedia(
                "(prefers-color-scheme: light)"
            ).matches;

        if (prefersLight) {

            body.classList.add("light-theme");

        }

    }


    /* =====================================================
       THEME BUTTON
    ===================================================== */

    if (themeToggle) {

        themeToggle.addEventListener(
            "click",
            () => {

                body.classList.toggle(
                    "light-theme"
                );

                const isLight =
                    body.classList.contains(
                        "light-theme"
                    );

                localStorage.setItem(
                    "raprint-theme",
                    isLight
                        ? "light"
                        : "dark"
                );

            }
        );

    }


    /* =====================================================
       MOBILE MENU
    ===================================================== */

    if (
        mobileMenuButton &&
        navigation
    ) {

        mobileMenuButton.addEventListener(
            "click",
            () => {

                const isOpen =
                    navigation.classList.toggle(
                        "mobile-open"
                    );

                mobileMenuButton.classList.toggle(
                    "active",
                    isOpen
                );

                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    String(isOpen)
                );

            }
        );


        const navigationLinks =
            navigation.querySelectorAll("a");

        navigationLinks.forEach(
            (link) => {

                link.addEventListener(
                    "click",
                    () => {

                        navigation.classList.remove(
                            "mobile-open"
                        );

                        mobileMenuButton.classList.remove(
                            "active"
                        );

                        mobileMenuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );

                    }
                );

            }
        );

    }


    /* =====================================================
       FAQ
    ===================================================== */

    const faqItems =
        document.querySelectorAll(
            ".faq details"
        );

    faqItems.forEach(
        (item) => {

            item.addEventListener(
                "toggle",
                () => {

                    if (!item.open) {
                        return;
                    }

                    faqItems.forEach(
                        (otherItem) => {

                            if (
                                otherItem !== item &&
                                otherItem.open
                            ) {

                                otherItem.open = false;

                            }

                        }
                    );

                }
            );

        }
    );


    /* =====================================================
       ORDER FORM → SERVER → TELEGRAM
    ===================================================== */

    if (orderForm) {

        orderForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                /* -----------------------------------------
                   Получаем данные формы
                ----------------------------------------- */

                const formData =
                    new FormData(orderForm);


                const name =
                    String(
                        formData.get("name") || ""
                    ).trim();


                const contact =
                    String(
                        formData.get("contact") || ""
                    ).trim();


                const description =
                    String(
                        formData.get("description") || ""
                    ).trim();


                const model =
                    String(
                        formData.get("model") || ""
                    ).trim();


                const file =
                    formData.get("file");


                /* -----------------------------------------
                   Проверяем обязательные поля
                ----------------------------------------- */

                if (
                    !name ||
                    !contact ||
                    !description
                ) {

                    showOrderResult(
                        "error",
                        "Пожалуйста, заполните имя, контакт и описание задачи."
                    );

                    return;

                }


                /* -----------------------------------------
                   Проверка файла
                ----------------------------------------- */

                if (
                    file &&
                    file instanceof File &&
                    file.size > 20 * 1024 * 1024
                ) {

                    showOrderResult(
                        "error",
                        "Файл слишком большой. Максимальный размер — 20 МБ."
                    );

                    return;

                }


                /* -----------------------------------------
                   Состояние кнопки
                ----------------------------------------- */

                setOrderLoading(true);


                showOrderResult(
                    "",
                    "Отправляем заявку..."
                );


                try {

                    /* -------------------------------------
                       Отправляем форму на Node.js сервер
                    ------------------------------------- */

                    const response =
                        await fetch(
                            "/api/order",
                            {
                                method: "POST",
                                body: formData
                            }
                        );


                    /* -------------------------------------
                       Пытаемся получить JSON
                    ------------------------------------- */

                    let result;

                    try {

                        result =
                            await response.json();

                    } catch (jsonError) {

                        throw new Error(
                            "Сервер вернул некорректный ответ."
                        );

                    }


                    /* -------------------------------------
                       Ошибка сервера
                    ------------------------------------- */

                    if (
                        !response.ok ||
                        !result.success
                    ) {

                        throw new Error(
                            result.message ||
                            "Не удалось отправить заявку."
                        );

                    }


                    /* -------------------------------------
                       УСПЕШНАЯ ОТПРАВКА
                    ------------------------------------- */

                    const orderNumber =
                        result.orderNumber
                            ? ` №${result.orderNumber}`
                            : "";


                    showOrderResult(
                        "success",
                        `✓ Заявка${orderNumber} успешно отправлена! Мы свяжемся с вами в ближайшее время.`
                    );


                    /* -------------------------------------
                       Сохраняем только факт отправки
                       без персональных данных
                    ------------------------------------- */

                    localStorage.setItem(
                        "raprint-last-order",
                        new Date().toISOString()
                    );


                    /* -------------------------------------
                       Очищаем форму
                    ------------------------------------- */

                    orderForm.reset();


                    /* -------------------------------------
                       Возвращаем кнопку через небольшой
                       промежуток времени
                    ------------------------------------- */

                    setTimeout(
                        () => {

                            setOrderLoading(false);

                        },
                        500
                    );


                } catch (error) {

                    console.error(
                        "Ошибка отправки заявки:",
                        error
                    );


                    /* -------------------------------------
                       Ошибка соединения
                    ------------------------------------- */

                    showOrderResult(
                        "error",
                        error.message ||
                        "Не удалось отправить заявку. Попробуйте ещё раз."
                    );


                    setOrderLoading(false);

                }

            }
        );

    }


    /* =====================================================
       ORDER RESULT
    ===================================================== */

    function showOrderResult(
        type,
        message
    ) {

        if (!orderResult) {
            return;
        }


        orderResult.className =
            "order-result";


        if (type) {

            orderResult.classList.add(
                type
            );

        }


        orderResult.textContent =
            message;

    }


    /* =====================================================
       ORDER BUTTON LOADING
    ===================================================== */

    function setOrderLoading(
        isLoading
    ) {

        if (orderSubmit) {

            orderSubmit.disabled =
                isLoading;

        }


        if (orderSubmitText) {

            orderSubmitText.textContent =
                isLoading
                    ? "Отправляем..."
                    : "Отправить заявку";

        }


        if (orderSubmitArrow) {

            orderSubmitArrow.textContent =
                isLoading
                    ? "..."
                    : "→";

        }

    }


    /* =====================================================
       HEADER SCROLL
    ===================================================== */

    if (header) {

        const updateHeader =
            () => {

                if (
                    window.scrollY > 30
                ) {

                    header.classList.add(
                        "scrolled"
                    );

                } else {

                    header.classList.remove(
                        "scrolled"
                    );

                }

            };


        window.addEventListener(
            "scroll",
            updateHeader,
            {
                passive: true
            }
        );


        updateHeader();

    }


    /* =====================================================
       SMOOTH ANCHOR SCROLL
    ===================================================== */

    const anchors =
        document.querySelectorAll(
            'a[href^="#"]'
        );


    anchors.forEach(
        (anchor) => {

            anchor.addEventListener(
                "click",
                (event) => {

                    const href =
                        anchor.getAttribute(
                            "href"
                        );


                    if (
                        !href ||
                        href === "#"
                    ) {

                        return;

                    }


                    let target;

                    try {

                        target =
                            document.querySelector(
                                href
                            );

                    } catch (error) {

                        return;

                    }


                    if (!target) {

                        return;

                    }


                    event.preventDefault();


                    const headerHeight =
                        header
                            ? header.offsetHeight
                            : 0;


                    const targetPosition =
                        target.getBoundingClientRect()
                            .top
                        +
                        window.scrollY
                        -
                        headerHeight
                        -
                        15;


                    window.scrollTo({

                        top:
                            targetPosition,

                        behavior:
                            "smooth"

                    });

                }
            );

        }
    );


    /* =====================================================
       ESC — CLOSE MOBILE MENU
    ===================================================== */

    document.addEventListener(
        "keydown",
        (event) => {

            if (
                event.key === "Escape" &&
                navigation &&
                mobileMenuButton
            ) {

                navigation.classList.remove(
                    "mobile-open"
                );

                mobileMenuButton.classList.remove(
                    "active"
                );

                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    /* =====================================================
       CLICK OUTSIDE — CLOSE MOBILE MENU
    ===================================================== */

    document.addEventListener(
        "click",
        (event) => {

            if (
                !navigation ||
                !mobileMenuButton
            ) {

                return;

            }


            const clickedInsideNavigation =
                navigation.contains(
                    event.target
                );


            const clickedButton =
                mobileMenuButton.contains(
                    event.target
                );


            if (
                !clickedInsideNavigation &&
                !clickedButton
            ) {

                navigation.classList.remove(
                    "mobile-open"
                );

                mobileMenuButton.classList.remove(
                    "active"
                );

                mobileMenuButton.setAttribute(
                    "aria-expanded",
                    "false"
                );

            }

        }
    );


    /* =====================================================
       FILE NAME DISPLAY
       Если в HTML есть #orderFile,
       показываем имя выбранного файла
    ===================================================== */

    const orderFile =
        document.getElementById(
            "orderFile"
        );


    if (orderFile) {

        orderFile.addEventListener(
            "change",
            () => {

                const file =
                    orderFile.files &&
                    orderFile.files.length
                        ? orderFile.files[0]
                        : null;


                if (!file) {
                    return;
                }


                /*
                    Можно использовать отдельный элемент
                    #orderFileName, если он есть.
                */

                const fileNameElement =
                    document.getElementById(
                        "orderFileName"
                    );


                if (fileNameElement) {

                    fileNameElement.textContent =
                        `Выбран файл: ${file.name}`;

                }

            }
        );

    }


});