const API_URL = 'https://wandering-curved-mapusaurus.glitch.me';
const LOCATION_URL = 'api/locations';
const VACANCY_URL = 'api/vacancy';
const BOT_TOKEN = '6353166980:AAGNunOqz1Gw0DBwRob9Y5IfU-HWOKwJNdc';

const preloader = {
  add() {
    document.head.insertAdjacentHTML(
      'beforeend',
      `<style id="preload">body{position:relative}.spinner-wrapper{position:fixed;top:0;left:0;height:100vh;width:100%;display:flex;align-items:center;justify-content:center;z-index:9999;background-color:rgba(255,255,255,.9)}.spinner{width:140px;text-align:center}.spinner>div{width:36px;height:36px;background-color:#a6adff;border-radius:100%;display:inline-block;-webkit-animation:bouncedelay 1.4s infinite ease-in-out;animation:bouncedelay 1.4s infinite ease-in-out;-webkit-animation-fill-mode:both;animation-fill-mode:both}.spinner .bounce1{-webkit-animation-delay:-.32s;animation-delay:-.32s}.spinner .bounce2{-webkit-animation-delay:-.16s;animation-delay:-.16s}@-webkit-keyframes bouncedelay{0%,100%,80%{-webkit-transform:scale(0)}40%{-webkit-transform:scale(1)}}@keyframes bouncedelay{0%,100%,80%{transform:scale(0);-webkit-transform:scale(0)}40%{transform:scale(1);-webkit-transform:scale(1)}}</style>`,
    );
    document.body.insertAdjacentHTML(
      'afterbegin',
      `
      <div class="spinner-wrapper">
        <div class="spinner">
          <div class="bounce1"></div>
          <div class="bounce2"></div>
          <div class="bounce3"></div>
        </div>
      </div>
    `,
    );
  },
  remove() {
    setTimeout(() => {
      const preload = document.querySelector('#preload');
      const spinnerWrapper = document.querySelector('.spinner-wrapper');
      preload.remove();
      spinnerWrapper.remove();
    }, 500);
  },
};

const cardsList = document.querySelector('.cards__list');

let lastUrl = '';
const pagination = {};

const getData = async (url, cbSuccess, cbError) => {
  try {
    const response = await fetch(url);
    const data = await response.json();
    cbSuccess(data);
  } catch (error) {
    cbError(error);
  }
};

// Фикс бага с input type="number" для браузера Firefox
const inputNumberFFPolyfill = () => {
  const inputNumberElems = document.querySelectorAll('[type="number"]');
  inputNumberElems.forEach((inputElem) => {
    let value = '';

    inputElem.addEventListener('input', (e) => {
      if (isNaN(parseInt(e.data))) {
        e.target.value = value;
      }
      value = e.target.value;
    });
  });
};

const createCard = (vacancy) => `
  <article class="vacancy" tabindex="0" data-id=${vacancy.id}>
    <img class="vacancy__img" src="${API_URL}/${
  vacancy.logo
}" alt="Логотип компании ${vacancy.company}" height="44">

    <p class="vacancy__company">${vacancy.company}</p>

    <h3 class="vacancy__title">${vacancy.title}</h3>

    <ul class="vacancy__fields">
      <li class="vacancy__field">от ${parseInt(
        vacancy.salary,
      ).toLocaleString()}₽</li>
      <li class="vacancy__field">${vacancy.type}</li>
      <li class="vacancy__field">${vacancy.format}</li>
      <li class="vacancy__field">${vacancy.experience}</li>
    </ul>
  </article>
`;

const createCards = (data) => {
  return data.vacancies.map((vacancy) => {
    const li = document.createElement('li');
    li.className = 'cards__item';
    li.insertAdjacentHTML('beforeend', createCard(vacancy));
    return li;
  });
};

const renderVacancies = (data) => {
  cardsList.textContent = '';
  preloader.add();
  const cards = createCards(data);
  cardsList.append(...cards);

  preloader.remove();

  if (data.pagination) {
    Object.assign(pagination, data.pagination);
  }
  if (cardsList.lastElementChild === null) {
    cardsList.innerHTML = `<h3>Вакансий не найдено. Измените фильтр поиска</h3>`;
  } else {
    observer.observe(cardsList.lastElementChild);
  }
};

const renderMoreVacancies = (data) => {
  const cards = createCards(data);
  cardsList.append(...cards);

  if (data.pagination) {
    Object.assign(pagination, data.pagination);
  }

  observer.observe(cardsList.lastElementChild);
};

const loadMoreVacancies = () => {
  if (pagination.totalPages > pagination.currentPage) {
    const urlWithParams = new URL(lastUrl);
    urlWithParams.searchParams.set('page', pagination.currentPage + 1);
    urlWithParams.searchParams.set('limit', window.innerWidth < 768 ? 6 : 12);

    getData(urlWithParams, renderMoreVacancies, renderError).then(() => {
      lastUrl = urlWithParams;
    });
  }
};

const renderError = (err) => {
  console.warn(err);
};

const createDetailVacancy = (data) => `
  <article class="detail">
    <div class="detail__header">
      <img class="detail__logo" src="${API_URL}/${
  data.logo
}" alt="Логотип компании ${data.company}">

      <p class="detail__company">${data.company}</p>

      <h2 class="detail__title">${data.title}</h2>
    </div>

    <div class="detail__main">
      <div class="detail__description">
        <p>${data.description.replaceAll('\n', '</p><p>')}</p>
      </div>
      <ul class="detail__fields">
        <li class="detail__field">от ${parseInt(
          data.salary,
        ).toLocaleString()}₽</li>
        <li class="detail__field">${data.type}</li>
        <li class="detail__field">${data.format}</li>
        <li class="detail__field">опыт: ${data.experience}</li>
        <li class="detail__field">${data.location}</li>
      </ul>
    </div>

    ${
      isNaN(parseInt(data.id.slice(-1)))
        ? `<div class="detail__resume">Отправляйте резюме на <a class="blue-text" href="mailto:${data.email}">${data.email}</a></div>`
        : `<form class="detail__tg">
          <input class="detail__input" type="text" name="message" placeholder="Напишите свой e-mail для отклика" />
          <input name="vacancyId" value="${data.id}" type="hidden" />
          <button class="detail__btn btn">Отправить</button>
        </form>
        `
    }

    
  </article>
`;

const sendTelegram = (modal) => {
  modal.addEventListener('submit', (e) => {
    e.preventDefault();
    const form = e.target.closest('.detail__tg');

    const userId = '1955080584';
    const text = `Отклик на вакансию ${form.vacancyId.value}, email: ${form.message.value}`;
    const urlBot = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage?chat_id=${userId}&text=${text}`;

    fetch(urlBot)
      .then((respose) => alert('Успешно отправлено'))
      .then(() => modal.remove())
      .catch((error) => {
        alert('Ошибка!');
        console.log(error);
      });
  });
};

// Открытие модалки по нажатию Enter на карточке
const openModalOnEnter = ({ code, target }) => {
  if (
    (code === 'Enter' || code === 'NumpadEnter') &&
    target.closest('.vacancy')
  ) {
    const vacancyId = target.dataset.id;
    openModal(vacancyId);
    target.blur();
    cardsList.removeEventListener('keydown', openModalOnEnter);
  }
};

const renderModal = (data) => {
  const modal = document.createElement('div');
  modal.className = 'modal modal_detail';

  const modalMain = document.createElement('div');
  modalMain.className = 'modal__main';
  modalMain.innerHTML = createDetailVacancy(data);

  const modalClose = document.createElement('button');
  modalClose.className = 'modal__close';
  modalClose.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M10.7833 10L15.3889 5.39444C15.4799 5.28816 15.5275 5.15145 15.5221 5.01163C15.5167 4.87181 15.4587 4.73918 15.3598 4.64024C15.2608 4.5413 15.1282 4.48334 14.9884 4.47794C14.8486 4.47254 14.7118 4.52009 14.6056 4.61111L10 9.21666L5.39446 4.60555C5.28984 4.50094 5.14796 4.44217 5.00001 4.44217C4.85207 4.44217 4.71018 4.50094 4.60557 4.60555C4.50095 4.71017 4.44218 4.85205 4.44218 5C4.44218 5.14794 4.50095 5.28983 4.60557 5.39444L9.21668 10L4.60557 14.6056C4.54741 14.6554 4.50018 14.7166 4.46683 14.7856C4.43349 14.8545 4.41475 14.9296 4.41179 15.0061C4.40884 15.0826 4.42173 15.1589 4.44966 15.2302C4.47759 15.3015 4.51995 15.3662 4.5741 15.4204C4.62824 15.4745 4.69299 15.5169 4.76428 15.5448C4.83557 15.5727 4.91186 15.5856 4.98838 15.5827C5.06489 15.5797 5.13996 15.561 5.20888 15.5276C5.27781 15.4943 5.3391 15.447 5.3889 15.3889L10 10.7833L14.6056 15.3889C14.7118 15.4799 14.8486 15.5275 14.9884 15.5221C15.1282 15.5167 15.2608 15.4587 15.3598 15.3598C15.4587 15.2608 15.5167 15.1282 15.5221 14.9884C15.5275 14.8485 15.4799 14.7118 15.3889 14.6056L10.7833 10Z"
        fill="currentColor" />
    </svg>
  `;

  modalMain.append(modalClose);
  modal.append(modalMain);
  document.body.append(modal);

  // Закрытие модалки
  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.modal__close')) {
      modal.remove();
      cardsList.addEventListener('keydown', openModalOnEnter);
    }
  });

  sendTelegram(modal);
};

const openModal = (id) => {
  preloader.add();
  getData(`${API_URL}/${VACANCY_URL}/${id}`, renderModal, renderError).then(
    () => preloader.remove(),
  );
};

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        loadMoreVacancies();
      }
    });
  },
  {
    rootMargin: '100px',
  },
);

// Открытие/закрытие фильтра на мобилах
const openFilter = (
  btn,
  dropDown,
  classNameBtnActive,
  classNameDropdownActive,
) => {
  dropDown.style.height = `${dropDown.scrollHeight}px`;
  btn.classList.add(classNameBtnActive);
  dropDown.classList.add(classNameDropdownActive);
  setTimeout(() => {
    dropDown.style.overflow = 'unset';
  }, 400);
};

const closeFilter = (
  btn,
  dropDown,
  classNameBtnActive,
  classNameDropdownActive,
) => {
  btn.classList.remove(classNameBtnActive);
  dropDown.classList.remove(classNameDropdownActive);
  dropDown.style.height = ``;
  dropDown.style.overflow = '';
};

const init = () => {
  try {
    const filterForm = document.querySelector('.filter__form');
    const vacanciesFilterBtn = document.querySelector('.vacancies__filter-btn');
    const vacanciesFilterList = document.querySelector('.vacancies__filter');

    // Select city
    const citySelect = document.querySelector('#city');
    const cityChoices = new Choices(citySelect, {
      searchEnabled: false,
      itemSelectText: '',
    });

    const locationUrl = new URL(`${API_URL}/${LOCATION_URL}`);

    getData(
      locationUrl,
      (locationData) => {
        const locations = locationData.map((location) => ({ value: location }));
        cityChoices.setChoices(locations, 'value', 'label', true);
        placeholderItem = cityChoices._getTemplate(
          'placeholder',
          'Выбрать город',
        );
        cityChoices.itemList.append(placeholderItem);

        filterForm.addEventListener('reset', (e) => {
          if (!cityChoices.config.searchEnabled) {
            cityChoices.removeActiveItems();
            cityChoices.setChoiceByValue('');
            cityChoices.itemList.append(placeholderItem);
          } else {
            cityChoices.itemList.append(placeholderItem);
            cityChoices.setChoices(locations, 'value', 'label', true);
          }
          const urlWithParams = new URL(`${API_URL}/${VACANCY_URL}`);
          urlWithParams.searchParams.set(
            'limit',
            window.innerWidth < 768 ? 6 : 12,
          );
          urlWithParams.searchParams.set('page', 1);
          getData(urlWithParams, renderVacancies, renderError).then(() => {
            lastUrl = urlWithParams;
          });
        });
      },
      (err) => {
        console.log(err);
      },
    );

    // Cards
    const cardsUrlWithParams = new URL(`${API_URL}/${VACANCY_URL}`);
    cardsUrlWithParams.searchParams.set(
      'limit',
      window.innerWidth < 768 ? 6 : 12,
    );
    cardsUrlWithParams.searchParams.set('page', 1);

    getData(cardsUrlWithParams, renderVacancies, renderError).then(() => {
      lastUrl = cardsUrlWithParams;
    });

    // Modal
    // Открытие модалки по клику на карточку
    cardsList.addEventListener('click', ({ target }) => {
      const vacancyCard = target.closest('.vacancy');

      if (vacancyCard) {
        const vacancyId = vacancyCard.dataset.id;
        openModal(vacancyId);
        target.blur();
      }
    });

    // Открытие модалки по нажатию Enter на карточке
    cardsList.addEventListener('keydown', openModalOnEnter);

    // Filter
    vacanciesFilterBtn.addEventListener('click', () => {
      if (
        vacanciesFilterBtn.classList.contains('vacancies__filter-btn_active')
      ) {
        closeFilter(
          vacanciesFilterBtn,
          vacanciesFilterList,
          'vacancies__filter-btn_active',
          'vacancies__filter_active',
        );
      } else {
        openFilter(
          vacanciesFilterBtn,
          vacanciesFilterList,
          'vacancies__filter-btn_active',
          'vacancies__filter_active',
        );
      }
    });

    window.addEventListener('resize', (e) => {
      if (
        vacanciesFilterBtn.classList.contains('vacancies__filter-btn_active')
      ) {
        // 1 вариант
        // vacanciesFilterList.style.height = `${dropDown.scrollHeight}px`;
        // 2 вариант
        closeFilter(
          vacanciesFilterBtn,
          vacanciesFilterList,
          'vacancies__filter-btn_active',
          'vacancies__filter_active',
        );
      }
    });

    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const formData = new FormData(filterForm);
      const urlWithParams = new URL(`${API_URL}/${VACANCY_URL}`);

      formData.forEach((value, key) => {
        urlWithParams.searchParams.append(key, value);
      });

      getData(urlWithParams, renderVacancies, renderError)
        .then(() => {
          lastUrl = urlWithParams;
        })
        .then(() => {
          closeFilter(
            vacanciesFilterBtn,
            vacanciesFilterList,
            'vacancies__filter-btn_active',
            'vacancies__filter_active',
          );
        });
    });
  } catch (error) {
    console.warn('error: ', error);
    console.warn('Это не страница index.html');
  }

  try {
    const validationForm = (form) => {
      const validate = new JustValidate(form, {
        errorsContainer: document.querySelector('.employer__errors'),
        errorLabelStyle: { color: 'red' },
        errorFieldStyle: { outline: '1px solid #FF0000' },
      });

      validate
        .addField('#logo', [
          {
            rule: 'minFilesCount',
            value: 1,
            errorMessage: 'Добавьте логотип',
          },
          {
            rule: 'files',
            value: {
              files: {
                extensions: ['jpeg', 'jpg', 'png'],
                maxSize: 102400,
                minSize: 1000,
                types: ['image/jpeg', 'image/png'],
              },
            },
            errorMessage: 'Размер файла не должен превышать 100 Кб',
          },
        ])
        .addField('#company', [
          {
            rule: 'required',
            errorMessage: 'Заполните поле "Название компании"',
          },
        ])
        .addField('#title', [
          {
            rule: 'required',
            errorMessage: 'Заполните поле "Название вакансии"',
          },
        ])
        .addField('#salary', [
          {
            rule: 'required',
            errorMessage: 'Заполните поле "Заработная плата"',
          },
        ])
        .addField('#location', [
          {
            rule: 'required',
            errorMessage: 'Заполните поле "Город"',
          },
        ])
        .addField('#email', [
          {
            rule: 'required',
            errorMessage: 'Заполните поле "E-mail"',
          },
          {
            rule: 'email',
            errorMessage: 'Некорректный формат e-mail',
          },
        ])
        .addField('#description', [
          {
            rule: 'required',
            errorMessage: 'Заполните поле "Описание вакансии"',
          },
        ])
        .addRequiredGroup('#format', 'Выберите Формат')
        .addRequiredGroup('#experience', 'Выберите Опыт работы')
        .addRequiredGroup('#type', 'Выберите Занятость');

      return validate;
    };

    const fileController = () => {
      const file = document.querySelector('.file');
      const filePreview = file.querySelector('.file__preview');
      const fileInput = file.querySelector('.file__input');

      let myDropzone = new Dropzone('.file__wrap-preview', {
        url: '/file/post',
        acceptedFiles: '.jpg, .jpeg, .png',
        init: function () {
          this.on('addedfile', (file) => {
            setTimeout(() => {
              filePreview.src = file.dataURL;
            }, 500);
            console.log('Файл получен');
            fileInput.files[0] = file;
          });
        },
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          const src = URL.createObjectURL(e.target.files[0]);
          file.classList.add('file_active');
          filePreview.src = src;
          filePreview.style.display = 'block';
        } else {
          file.classList.remove('file_active');
          filePreview.src = './img/no-logo.jpg';
          // filePreview.style.display = 'none';
        }
      });
    };

    const showInvalidRadioTitle = () => {
      const employerFieldsetRadioElems = document.querySelectorAll(
        '.employer__fieldset-radio',
      );

      employerFieldsetRadioElems.forEach((employerFieldsetRadio) => {
        const employerLegend =
          employerFieldsetRadio.querySelector('.employer__legend');
        const employerRadioElems =
          employerFieldsetRadio.querySelectorAll('.radio__input');

        const isInvalid = [...employerRadioElems].some((radio) =>
          radio.classList.contains('just-validate-error-field'),
        );

        if (isInvalid) {
          employerLegend.style.color = 'red';
        } else {
          employerLegend.style.color = '';
        }
      });
    };

    const formController = () => {
      const form = document.querySelector('.employer__form');

      const validate = validationForm(form);

      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!validate.isValid) {
          showInvalidRadioTitle();
          form.addEventListener('change', showInvalidRadioTitle);
          return;
        }

        try {
          const formData = new FormData(form);

          preloader.add();
          const response = await fetch(`${API_URL}/${VACANCY_URL}`, {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            preloader.remove();
            window.location.href = '/';
          }

          console.log('Sent');
          form.reset();
        } catch (error) {
          preloader.remove();
          document.querySelector('.employer__errors').textContent = `Произошла ошибка: ${error.message}`;
          console.error(error);
        }
      });
    };

    formController();
    fileController();
  } catch (error) {
    console.warn('error: ', error);
    console.warn('Это не страница employer.html');
  }

  // Включаем полифилл для поля с type="number" только если браузер - Firefox
  if (navigator.userAgent.match(/Firefox/i)) {
    console.log('Firefox');
    inputNumberFFPolyfill();
  }
};

init();
