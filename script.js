class ItcSlider {
  static CLASS_CONTROL = "slider__control";
  static CLASS_CONTROL_HIDE = "slider__control_hide";
  static CLASS_ITEM_ACTIVE = "slider__item_active";
  static CLASS_INDICATOR_ACTIVE = "active";
  static SEL_WRAPPER = ".slider__wrapper";
  static SEL_ITEM = ".slider__item";
  static SEL_ITEMS = ".slider__items";
  static SEL_PREV = '.slider__control[data-slide="prev"]';
  static SEL_NEXT = '.slider__control[data-slide="next"]';
  static SEL_INDICATOR = ".slider__indicators>li";
  static TRANSITION_OFF = "slider_disable-transition";
  static contains = [];
  static createInstances() {
    document.querySelectorAll('[data-slider="itc-slider"]').forEach((t) => {
      if (this.contains.find((e) => e.el === t)) return;
      const e = t.dataset,
        s = {};
      Object.keys(e).forEach((t) => {
        if ("slider" === t) return;
        let i = e[t];
        (i = "true" === i || i),
          (i = "false" !== i && i),
          (i = Number.isNaN(Number(i)) ? Number(i) : i),
          (s[t] = i);
      }),
        this.contains.push({ el: t, slider: new ItcSlider(t, s) }),
        (t.dataset.sliderId = this.contains.length),
        t.querySelectorAll(".slider__control").forEach((t) => {
          t.dataset.sliderTarget = this.contains.length;
        });
    });
  }
  constructor(t, e) {
    (this._el = "string" == typeof t ? document.querySelector(t) : t),
      (this._elWrapper = this._el.querySelector(ItcSlider.SEL_WRAPPER)),
      (this._elItems = this._el.querySelector(ItcSlider.SEL_ITEMS)),
      (this._elsItem = this._el.querySelectorAll(ItcSlider.SEL_ITEM)),
      (this._elsIndicator = this._el.querySelectorAll(ItcSlider.SEL_INDICATOR)),
      (this._btnPrev = this._el.querySelector(ItcSlider.SEL_PREV)),
      (this._btnNext = this._el.querySelector(ItcSlider.SEL_NEXT)),
      (this._exOrderMin = 0),
      (this._exOrderMax = 0),
      (this._exItemMin = null),
      (this._exItemMax = null),
      (this._exTranslateMin = 0),
      (this._exTranslateMax = 0),
      (this._direction = "next"),
      (this._intervalId = null),
      (this._isSwiping = !1),
      (this._swipeX = 0),
      (this._config = {
        loop: !0,
        autoplay: !1,
        interval: 5e3,
        refresh: !0,
        swipe: !0,
        ...e,
      }),
      this._setInitialValues(),
      this._addEventListener();
  }
  _addEventListener() {
    this._el.addEventListener("click", (t) => {
      if (
        (this._autoplay("stop"),
        t.target.classList.contains(ItcSlider.CLASS_CONTROL))
      )
        t.preventDefault(),
          (this._direction = t.target.dataset.slide),
          this._move();
      else if (t.target.dataset.slideTo) {
        const e = parseInt(t.target.dataset.slideTo, 10);
        this._moveTo(e);
      }
      this._config.loop && this._autoplay();
    }),
      this._el.addEventListener("mouseenter", () => {
        this._autoplay("stop");
      }),
      this._el.addEventListener("mouseleave", () => {
        this._autoplay();
      }),
      this._config.refresh &&
        window.addEventListener("resize", () => {
          window.requestAnimationFrame(this._reset.bind(this));
        }),
      this._config.loop &&
        (this._elItems.addEventListener("itcslider-start", () => {
          this._isBalancing ||
            ((this._isBalancing = !0),
            window.requestAnimationFrame(this._balanceItems.bind(this)));
        }),
        this._elItems.addEventListener("transitionend", () => {
          this._isBalancing = !1;
        }));
    const t = (t) => {
        this._autoplay("stop");
        const e = 0 === t.type.search("touch") ? t.touches[0] : t;
        (this._swipeX = e.clientX), (this._isSwiping = !0);
      },
      e = (t) => {
        if (!this._isSwiping) return;
        const e = 0 === t.type.search("touch") ? t.changedTouches[0] : t,
          s = this._swipeX - e.clientX;
        s > 50
          ? ((this._direction = "next"), this._move())
          : s < -50 && ((this._direction = "prev"), this._move()),
          (this._isSwiping = !1),
          this._config.loop && this._autoplay();
      };
    this._config.swipe &&
      (this._el.addEventListener("touchstart", t),
      this._el.addEventListener("mousedown", t),
      document.addEventListener("touchend", e),
      document.addEventListener("mouseup", e)),
      this._el.addEventListener("dragstart", (t) => {
        t.preventDefault();
      }),
      document.addEventListener("visibilitychange", () => {
        "hidden" === document.visibilityState
          ? this._autoplay("stop")
          : "visible" === document.visibilityState &&
            this._config.loop &&
            this._autoplay();
      });
  }
  _autoplay(t) {
    if (this._config.autoplay)
      return "stop" === t
        ? (clearInterval(this._intervalId), void (this._intervalId = null))
        : void (
            null === this._intervalId &&
            (this._intervalId = setInterval(() => {
              (this._direction = "next"), this._move();
            }, this._config.interval))
          );
  }
  _balanceItems() {
    if (!this._isBalancing) return;
    const t = this._elWrapper.getBoundingClientRect(),
      e = t.width / this._countActiveItems / 2,
      s = this._elsItem.length;
    if ("next" === this._direction) {
      if (this._exItemMin.getBoundingClientRect().right < t.left - e) {
        this._exItemMin.dataset.order = this._exOrderMin + s;
        const t = this._exTranslateMin + s * this._widthItem;
        (this._exItemMin.dataset.translate = t),
          (this._exItemMin.style.transform = `translateX(${t}px)`),
          this._updateExProperties();
      }
    } else {
      if (this._exItemMax.getBoundingClientRect().left > t.right + e) {
        this._exItemMax.dataset.order = this._exOrderMax - s;
        const t = this._exTranslateMax - s * this._widthItem;
        (this._exItemMax.dataset.translate = t),
          (this._exItemMax.style.transform = `translateX(${t}px)`),
          this._updateExProperties();
      }
    }
    window.requestAnimationFrame(this._balanceItems.bind(this));
  }
  _changeActiveItems() {
    this._stateItems.forEach((t, e) => {
      t
        ? this._elsItem[e].classList.add(ItcSlider.CLASS_ITEM_ACTIVE)
        : this._elsItem[e].classList.remove(ItcSlider.CLASS_ITEM_ACTIVE),
        this._elsIndicator.length && t
          ? this._elsIndicator[e].classList.add(
              ItcSlider.CLASS_INDICATOR_ACTIVE
            )
          : this._elsIndicator.length &&
            !t &&
            this._elsIndicator[e].classList.remove(
              ItcSlider.CLASS_INDICATOR_ACTIVE
            );
    });
  }
  _move() {
    const t = "next" === this._direction ? -this._widthItem : this._widthItem,
      e = this._transform + t;
    if (!this._config.loop) {
      const t =
        this._widthItem * (this._elsItem.length - this._countActiveItems);
      if (e < -t || e > 0) return;
      this._btnPrev &&
        (this._btnPrev.classList.remove(ItcSlider.CLASS_CONTROL_HIDE),
        this._btnNext.classList.remove(ItcSlider.CLASS_CONTROL_HIDE)),
        this._btnPrev && e === -t
          ? this._btnNext.classList.add(ItcSlider.CLASS_CONTROL_HIDE)
          : this._btnPrev &&
            0 === e &&
            this._btnPrev.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
    }
    "next" === this._direction
      ? (this._stateItems = [
          ...this._stateItems.slice(-1),
          ...this._stateItems.slice(0, -1),
        ])
      : (this._stateItems = [
          ...this._stateItems.slice(1),
          ...this._stateItems.slice(0, 1),
        ]),
      this._changeActiveItems(),
      (this._transform = e),
      (this._elItems.style.transform = `translateX(${e}px)`),
      this._elItems.dispatchEvent(
        new CustomEvent("itcslider-start", { bubbles: !0 })
      );
  }
  _moveTo(t) {
    const e = this._stateItems.reduce((e, s, i) => {
      const a = s ? t - i : e;
      return Math.abs(a) < Math.abs(e) ? a : e;
    }, this._stateItems.length);
    if (0 !== e) {
      this._direction = e > 0 ? "next" : "prev";
      for (let t = 0; t < Math.abs(e); t++) this._move();
    }
  }
  _setInitialValues() {
    if (
      ((this._transform = 0),
      (this._stateItems = []),
      (this._isBalancing = !1),
      (this._widthItem = this._elsItem[0].getBoundingClientRect().width),
      (this._widthWrapper = this._elWrapper.getBoundingClientRect().width),
      (this._countActiveItems = Math.round(
        this._widthWrapper / this._widthItem
      )),
      this._elsItem.forEach((t, e) => {
        (t.dataset.index = e),
          (t.dataset.order = e),
          (t.dataset.translate = 0),
          (t.style.transform = ""),
          this._stateItems.push(e < this._countActiveItems ? 1 : 0);
      }),
      this._config.loop)
    ) {
      const t = this._elsItem.length - 1,
        e = -(t + 1) * this._widthItem;
      (this._elsItem[t].dataset.order = -1),
        (this._elsItem[t].dataset.translate = e),
        (this._elsItem[t].style.transform = `translateX(${e}px)`),
        this._updateExProperties();
    } else
      this._btnPrev &&
        this._btnPrev.classList.add(ItcSlider.CLASS_CONTROL_HIDE);
    this._changeActiveItems(), this._autoplay();
  }
  _reset() {
    const t = this._elsItem[0].getBoundingClientRect().width,
      e = this._elWrapper.getBoundingClientRect().width,
      s = Math.round(e / t);
    (t === this._widthItem && s === this._countActiveItems) ||
      (this._autoplay("stop"),
      this._elItems.classList.add(ItcSlider.TRANSITION_OFF),
      (this._elItems.style.transform = "translateX(0)"),
      this._setInitialValues(),
      window.requestAnimationFrame(() => {
        this._elItems.classList.remove(ItcSlider.TRANSITION_OFF);
      }));
  }
  _updateExProperties() {
    const t = Object.values(this._elsItem).map((t) => t),
      e = t.map((t) => Number(t.dataset.order));
    (this._exOrderMin = Math.min(...e)), (this._exOrderMax = Math.max(...e));
    const s = e.indexOf(this._exOrderMin),
      i = e.indexOf(this._exOrderMax);
    (this._exItemMin = t[s]),
      (this._exItemMax = t[i]),
      (this._exTranslateMin = Number(this._exItemMin.dataset.translate)),
      (this._exTranslateMax = Number(this._exItemMax.dataset.translate));
  }
  next() {
    (this._direction = "next"), this._move();
  }
  prev() {
    (this._direction = "prev"), this._move();
  }
  moveTo(t) {
    this._moveTo(t);
  }
  reset() {
    this._reset();
  }
}
document.addEventListener("DOMContentLoaded", () => {
  ItcSlider.createInstances();
});

document.addEventListener("DOMContentLoaded", () => {
  new ItcSlider(".slider", {
    loop: true, // без зацикливания
  });
});

document.addEventListener("DOMContentLoaded", () => {
  new ItcSlider(".slider-thank", {
    loop: true, // без зацикливания
  });
});

var acc = document.getElementsByClassName("accordion");
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].addEventListener("click", function () {
    for (let c = 0; c < acc.length; c++) {
      if (
        acc[c].classList.contains("active") &&
        !this.classList.contains("active")
      ) {
        acc[c].classList.remove("active");
        acc[c].nextElementSibling.style.maxHeight = null;
        acc[c].nextElementSibling.style.padding = "0 32px";
      }
    }

    this.classList.toggle("active");
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
      panel.style.padding = "0 32px";
    } else {
      panel.style.maxHeight = panel.scrollHeight + 100 + "px";
      panel.style.padding = "28px 32px";
    }
  });
}

//

var links = Array.from(document.querySelectorAll(".header__nav-item"));

for (var i = 0; i < links.length; i++) {
  var link = links[i];

  link.addEventListener("click", function () {
    document.querySelector(".header__checkbox").checked = false;
  });
}

var form = document.querySelector(".footer__form");

form.addEventListener("submit", submitTel);

async function submitTel(e) {
  e.preventDefault();
  const payload = new FormData(form);

  this.querySelector("button").disabled = true;

  var tel = payload.get("tel");

  tel = tel.match(/[0-9]/g).join("");

  payload.set("tel", tel);

  await fetch(`https://edauir.kz/edauirdev/backend/mail.php`, {
    method: "POST",
    body: payload,
  })
    .then((res) => {
      res.json();
      this.classList.add("active");
    })
    .catch((err) => {
      this.document.querySelector("button").disabled = false;
    });
}

window.addEventListener("DOMContentLoaded", function () {
  [].forEach.call(document.querySelectorAll(".tel"), function (input) {
    var keyCode;
    function mask(event) {
      event.keyCode && (keyCode = event.keyCode);
      var pos = this.selectionStart;
      if (pos < 3) event.preventDefault();
      var matrix = "+7 (___) ___ ____",
        i = 0,
        def = matrix.replace(/\D/g, ""),
        val = this.value.replace(/\D/g, ""),
        new_value = matrix.replace(/[_\d]/g, function (a) {
          return i < val.length ? val.charAt(i++) || def.charAt(i) : a;
        });
      i = new_value.indexOf("_");
      if (i != -1) {
        i < 5 && (i = 3);
        new_value = new_value.slice(0, i);
      }
      var reg = matrix
        .substr(0, this.value.length)
        .replace(/_+/g, function (a) {
          return "\\d{1," + a.length + "}";
        })
        .replace(/[+()]/g, "\\$&");
      reg = new RegExp("^" + reg + "$");
      if (
        !reg.test(this.value) ||
        this.value.length < 5 ||
        (keyCode > 47 && keyCode < 58)
      )
        this.value = new_value;
      if (event.type == "blur" && this.value.length < 5) this.value = "";
    }

    input.addEventListener("input", mask, false);
    input.addEventListener("focus", mask, false);
    input.addEventListener("blur", mask, false);
    input.addEventListener("keydown", mask, false);
  });
});
