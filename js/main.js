'use strict';
window.onload = function () {
    const
        // Ajax
        requestURL = '/functions.php',

        // Objects
        btnText = {
            off: 'Start',
            on: 'End'
        },
        settings = {
            btn: () => {
                onTimer == false ? timerBtn.innerHTML = btnText.off : timerBtn.innerHTML = btnText.on;
            },
            timer: () => {
                display.forEach(index => {
                    index.querySelector('.hours').innerHTML = hours+':';
                    index.querySelector('.minutes').innerHTML = minutes;
                })
            },
            zeroing: () => {
                history.innerHTML = '';
                minutes = 0;
                hours = 0;
                taskName.value = ''
                settings.timer();
            }
        }
    ;// Const

    let
        // DOM Objects
        timerBtn         = document.querySelector('.timer__btn'),
        display          = document.querySelectorAll('[display]'),
        history          = document.querySelector('.history__list'),
        taskName         = document.querySelector('.task-input'),
        tablinks         = document.querySelectorAll('[tablink]'),

        // Script variables
        onTimer     = false,
        hours       = 0,
        minutes     = 0,
        timeRequest = 0

    ;// variables

    document.querySelector('.ham').onclick = function (e) {
        e.preventDefault()
        document.querySelector('body').classList.toggle('active-menu')
    }

    //Changes value task
    let handler = function () {
        let body = {
            event: 'changesInput',
            target: 'task-input',
            id:    taskName.id,
            value: taskName.value
        }

        sendRequest(requestURL, body)
            .then(data => changeHistory(data))
            .catch(err => console.log(err));

        if (onTimer == false) {
            this.removeEventListener('input', handler);
        }
    }//Changes value task

    tablinks.forEach(index => {
        index.onclick = function (e) {
            e.preventDefault();

            document.querySelector('body').classList.remove('active-menu')

            tablinks.forEach(index => {
                document.querySelector(index.getAttribute('href')).classList.remove('active');
                index.classList.remove('active');
            });
            
            index.classList.add('active');
            document.querySelector(index.getAttribute('href')).classList.add('active');
        }
    });

    timerBtn.onclick = function () {
        if (taskName.value == '' && onTimer == false) {
            alert('Задача не поставлена!');
        } else {
            sendRequest(requestURL, {
                event: 'btnClick',
                task: taskName.value
            })
                .then(data => dataWrite(data))
                .catch(err => console.log(err));
        }
    }

    // Standard settings
    function standart() {
        const arraySettings = Object.values(settings);
        arraySettings.map((index, value) => {
            typeof index == 'function' ?
                index() :
                console.error(`${value+1} переменная в объекте не является функцией`);
        });
    }
    standart();

    // Get history
    sendRequest(requestURL, {
        event: 'history'
    })
        .then(data => dataWrite(data))
        .catch(err => console.log(err));

    function dataWrite(data) {

        let layout = ``;

        settings.zeroing();

        for (let key in data) {

            let allTimeMinutes = 0,
                item = data[key].massive;

            layout += `<li class="history__item">`

            item.map(index => {
                if (index.ready == true) {
                    allTimeMinutes += index.allTime
                    onTimer = false
                }
            })

            layout += `
                <div class="history__main">
                    <p class="date">Date: <strong>${key}</strong></p>
                    <p class="time">All the time: <strong>${Math.trunc(allTimeMinutes / 60)}:${allTimeMinutes % 60}</strong></p>
                    <div class="history__menu">
                        <button class="remove-date"><i class="far fa-trash-alt"></i></button>
                        <button class="open-submenu ${data[key].submenu}"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <ol class="submenu ${data[key].submenu}">
            `

            item.map(index => {

                layout += `
                    <li id="${index.id}">
                        <button class="remove-task"><i class="fal fa-times"></i></button>
                        <div class="input-wrapper">
                            <input type="text" value="${index.task}" class="li-input" placeholder="Enter task name..." readonly>
                            <button class="editor">edit</button>
                        </div>
                        <div class="row">
                            <div class="column">
                                <p>Getting started on a task</p>
                                <p>-</p>
                                <strong>${index.start}</strong>
                           </div>
                `

                if (index.ready == true) {
                    layout += `
                        <div class="column">
                            <p>Getting started on a task</p>
                            <p>-</p>
                            <strong>${index.end}</strong>
                        </div>
                        <div class="column">
                            <p>All the time:</p> 
                            <strong>${index.hours}:${index.minutes}</strong>
                        </div>
                    `

                    taskName.value = ''
                    taskName.removeAttribute('id')

                    taskName.removeEventListener('input', handler);

                } else {
                    onTimer = true
                    timeRequest = (+index.start.split(':')[0] * 60) + +index.start.split(':')[1];

                    taskName.value = index.task
                    taskName.id = index.id

                    taskName.addEventListener('input', handler);
                }

                layout += `</div></li>`
            });

            settings.btn()
            layout += `</ol></li>`
        }

        history.innerHTML = layout

        eventFor();

        //SetTimeout
        let timerId = setTimeout(function tick() {
            if (onTimer == true) {
                let
                    jsTime = new Date(),
                    timeNow = (jsTime.getHours() * 60 + jsTime.getMinutes()) - timeRequest
                ;// Variables

                hours = Math.trunc(timeNow / 60);
                minutes = timeNow % 60;
                settings.timer();
                timerId = setTimeout(tick, 5000);
            }
        }, 100);

    }// dataWrite

    function eventFor() {
        //Remove element by ID
        let taskRemoveBtn = document.querySelectorAll('.remove-task')
        taskRemoveBtn.forEach(index => {
            index.onclick = function () {
                sendRequest(requestURL, {
                    event: 'removeTask',
                    id: this.closest('li').id
                })
                    .then(data => dataWrite(data))
                    .catch(err => console.log(err));
            }
        })

        //Remove by Date
        let dateRemoveBtn = document.querySelectorAll('.remove-date')
        dateRemoveBtn.forEach(index => {
            index.onclick = function () {
                let allLi = this.closest('li').querySelectorAll('.submenu li'),
                    idsJs = [];

                allLi.forEach(function (index) {
                    idsJs.push(index.id);
                })

                sendRequest(requestURL, {
                    event: 'removeDate',
                    ids: idsJs
                })
                    .then(data => dataWrite(data))
                    .catch(err => console.log(err));
            }
        })

        //Changes value task
        let changesInput = document.querySelectorAll('.li-input')
        changesInput.forEach(index => {
            index.oninput = function () {

                let body = {
                    event: 'changesInput',
                    target: 'li-input',
                    id:    this.closest('li').id,
                    value: this.value
                }

                sendRequest(requestURL, body)
                    .then(data => changeHistory(data))
                    .catch(err => console.log(err));
            }
        })

        // JS for layout
        let
            inputWrapper = document.querySelectorAll('.editor'),
            buttonSubmenu = document.querySelectorAll('.open-submenu')

        ;// Variables

        buttonSubmenu.forEach(index => {
            index.onclick = function () {
                index.classList.toggle('active')
                index.closest('li').querySelector('.submenu').classList.toggle('active')
            }
        })

        inputWrapper.forEach(index => {
            let
                parent = index.closest('.input-wrapper'),
                input = parent.querySelector('input')
            ;// Variables

            input.onblur = function () {
                input.setAttribute('readonly', 'readonly')
                index.style.display = 'block'
            }

            index.onclick = function (e) {
                let valueInput = input.value;

                input.removeAttribute('readonly')
                e.target.style.display = 'none';

                input.focus()
                input.value = ' ';
                input.value = valueInput;
            }
        })
    }

    function changeHistory(data) {
        let allSubLi = document.querySelectorAll('.submenu li')

        if (data.target != 'task-input') {
            for (let key in allSubLi) {
                if (allSubLi[key].id == data.target) {
                    allSubLi[key].querySelector('.li-input').value = data.value
                }
            }
        } else {
            taskName.value = data.value
        }

    }

};// Window.load

// Ajax
function sendRequest(URL, body = null) {
    return new Promise((resolve, reject) => {
        // Request
        const ajax = new XMLHttpRequest();
        ajax.open('POST', URL);
        ajax.setRequestHeader('Content-Type', 'application/json');
        ajax.responseType = 'json';

        // Success
        ajax.onload = () => {
            if (ajax.status >= 400) {
                reject(ajax.response);
            } else {
                resolve(ajax.response);
            }
        };

        // Error
        ajax.onerror = () => {
            reject(ajax.response);
        };

        // Dispatch
        ajax.send(JSON.stringify(body));
    });
}
