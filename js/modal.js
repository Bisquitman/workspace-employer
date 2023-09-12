const scrollService = {
  scrollPosition: 0,
  disableScroll() {
    scrollService.scrollPosition = window.scrollY;
    document.body.style.cssText = `
      overflow: hidden;
      position: fixed;
      top: -${scrollService.scrollPosition}px;
      left: 0;
      height: 100vh;
      width: 100vw;
      padding-right: ${window.innerWidth - document.body.offsetWidth}px;
    `;
    document.documentElement.style.scrollBehavior = 'unset';
  },
  enableScroll() {
    document.body.style.cssText = '';
    window.scroll({ top: scrollService.scrollPosition });
    document.documentElement.style.scrollBehavior = '';
  },
};

const modalController = ({
  modal,  // Селектор модалаки, которую надо открыть
  btnOpen,  // Кнопка, по которой надо открывать модалку
  btnClose, // Кнопка, по которой надо закрывать модалку
  time = 300, // Длительность анимации открытия / закрытия модалки
  open, // Коллбэк-функция, которая вызывается в момент открытия модалки
  close, // Коллбэк-функция, которая вызывается после закрытия модалки
}) => {
  const buttonElems = document.querySelectorAll(btnOpen);
  const modalElem = document.querySelector(modal);

  modalElem.style.cssText = `
    display: flex;
    visibility: hidden;
    opacity: 0;
    transition: opacity ${time}ms ease-in-out;
  `;

  const closeModal = (event) => {
    const target = event.target;
    const code = event.code;

    if (
      event === 'close' ||
      target === modalElem ||
      (btnClose && target.closest(btnClose)) ||
      code === 'Escape'
    ) {
      modalElem.style.opacity = 0;

      setTimeout(() => {
        modalElem.style.visibility = 'hidden';
        scrollService.enableScroll();

        if (close) {
          close();
        }
      }, time);

      window.removeEventListener('keydown', closeModal);
    }
  };

  const openModal = (event) => {
    if (open) {
      open({ btn: event.target }); // В cb-функцию можно передать аргуметы, в виде объекта
    }

    modalElem.style.visibility = 'visible';
    modalElem.style.opacity = 1;
    window.addEventListener('keydown', closeModal);
    scrollService.disableScroll();
  };

  buttonElems.forEach((btnElem) => {
    btnElem.addEventListener('click', openModal);
  });

  modalElem.addEventListener('click', closeModal);

  modalElem.closeModal = closeModal;
  modalElem.openModal = openModal;

  return { openModal, closeModal };
};

modalController({
  modal: '.modal1',
  btnOpen: '.section__button1',
  btnClose: '.modal__close',
});

modalController({
  modal: '.modal2',
  btnOpen: '.section__button2',
  btnClose: '.modal__close',
});
