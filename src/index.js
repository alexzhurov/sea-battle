$(function () {
  /*////////////////////////////////////////////
  //// Store
  */////////////////////////////////////////////
  var store = {
    userName     : null,
    computerName : null,
    step         : {
      owner  : 'user', // for the first step
      number : 1,
    },
    fields       : {
      user     : null,
      computer : null,
    },
    series       : [ // Стандартный набор кораблей
      { len : 4, amount : 1 },
      { len : 3, amount : 2 },
      { len : 2, amount : 3 },
      { len : 1, amount : 4 },
    ],
    ships        : {
      user     : [],
      computer : [],
    },
    caption      : {
      axisX : ['А', 'Б', 'В', 'Г', 'Д', 'Е', 'Ж', 'З', 'И', 'К'],
      axisY : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    },
    result       : {
      user     : null,
      computer : null,
      winner   : null,
    },
  }

  /*////////////////////////////////////////////
  //// View
  */////////////////////////////////////////////
  var view = {
    showPlayer  : function () {
      // Получить имена игроков из инпутов
      store.userName = $('#user_name_input').val()
      store.computerName = $('#enemy_name_input').val()
    },
    showStep    : function (owner) {
      // Отобразить описание ходов битвы
      $('#step_number').html('Ход - ' + store.step.number)
      $('#step_owner').html('Ходит - ' + store[owner + 'Name'])

      store.step.number++
    },
    startFight  : function () {
      // Переключить на экран с полями битвы
      $('#screen_start').toggleClass('hidden')
      $('#screen_combat').toggleClass('hidden')
    },
    finishFight : function () {
      // Переключить на экран победителя
      $('#screen_combat').addClass('hidden')
      $('#finish_combat').removeClass('hidden')
      $('#result').html('Победитель - ' + store.result.winner)
    },
    renderField : function (owner) {
      var table = $('#' + owner + '_field > tbody')
      table.html('')// Сlear field on init


      for (var i = 0; i < 10; i++) {// Cчётчик для Y координаты
        var row = '<tr class="battlefield-row">'
        for (var j = 0; j < 10; j++) {// Cчётчик для X координаты
          var captionX  = '',
              captionY  = '',
              cellState = ''
          // Добавить подписи для осей в .battlefield-cell-content
          // в первую ячеку по х и по y
          if (i === 0) captionX = '<div class="marker marker__col">' + store.caption.axisX[j] + '</div>'
          if (j === 0) captionY = '<div class="marker marker__row">' + store.caption.axisY[i] + '</div>'
          // если 0 - пустая ячейка
          // если 1 - есть корабль
          // если 2 - корабль подстрелен
          // если 3 - пустая простреленная
          switch (store.fields[owner][i][j]) {
            case 1:
              // если отображается доска игрока то показать корабли
              if (owner === 'user') {
                cellState = 'deck'
              }
              break
            case 2:
              cellState = 'deck hit'
              break
            case 3:
              cellState = 'hit'
              break
          }

          // Отрендерить строку поля боя
          row += '<td class="battlefield-cell ' + cellState + '">' +
            '<div class="battlefield-cell-content" data-y="' + i + '" data-x="' + j + '">' +
            captionX +
            captionY +
            '</div>' +
            '</td>'
        }
        row += '</tr>'
        table.append(row)
      }

    },
  }
  /*////////////////////////////////////////////
  //// Model
  */////////////////////////////////////////////
  var model = {
    created       : function () {
      // Запускается при инициализации приложения

      // Добавить выстрел при клике по полю врага
      $('#computer_field > tbody').on('click', function (e) {
        model.shot(e, 'user')
      })
      // создать пустые данные для полей
      model.createField('user')
      model.createField('computer')
      // создать флот для каждого игрока
      model.createNavy('user')
      model.createNavy('computer')
      //  Вывести на экран поля из данных
      view.renderField('user')
      view.renderField('computer')
    },
    shot          : function (e, owner) {
      // Не стерлять пока не походит соперник
      if (store.step.owner !== owner) return
      // Задать в чьё поле будет выстрел
      var targetName = (owner === 'user') ? 'computer' : 'user'

      // Задать координаты выстрела
      // если стреляет игрок
      // взять координаты из cell data-y и data-x
      // если копьютер - сгенерировать случайные числа
      var target
      if (owner === 'user') {
        target = $(e.target).data()
        if (!target.hasOwnProperty('x')) return // если координат нет
      } else {
        target = {
          x : getRandom(9),
          y : getRandom(9),
        }
      }

      var fieldCell = store.fields[targetName][target.y][target.x]
      // Проверить ячейку куда стреляют
      switch (fieldCell) {
        case 0: // Пустая ячейка
          fieldCell = 3
          break
        case 1: // Есть корабль
          fieldCell = 2
          store.result[targetName]--
          break
        case 2: // Корабль подстрелен
        case 3: // Пустая простреленная
          // Если компьютер попал в подстреленную ячейку,
          // То стреляет ещё раз
          if (owner !== 'user') model.shot(null, 'computer')
          return
      }
      // Занести результат в поле
      store.fields[targetName][target.y][target.x] = fieldCell
      // Если попал в корабль
      // то проверить жив ли он
      // если мертв то закрасить ближайшие клетки
      if (fieldCell === 2) model.hideDrownShip(target, owner, targetName)
      view.renderField(targetName)
      // Передать право хода сопернику
      store.step.owner = targetName
      // Произвести ход соперника
      if (owner === 'user') {
        setTimeout(function () {
          model.shot(null, 'computer')
        }, getRandom(1000))
      }

      view.showStep(targetName)
      model.checkResult()

    },
    createShip    : function (len, owner) {
      var ship = {}

      ship.owner = owner
      ship.len = len
      ship.isVertical = getRandom(1)
      ship.decks = []
      // Сгенерировать позицию корабля
      if (ship.isVertical) {
        ship.x = getRandom(9)
        ship.y = getRandom(10 - len)
      } else {
        ship.x = getRandom(10 - len)
        ship.y = getRandom(9)
      }
      // Записать клетки бортов корабля
      for (var i = 0; i < ship.len; i++) {
        var deck = {}
        if (ship.isVertical) {
          deck.x = ship.x
          deck.y = ship.y + i
        } else {
          deck.x = ship.x + i
          deck.y = ship.y
        }
        ship.decks.push(deck)
      }
      // Проверяем валидность координат всех палуб корабля:
      // нет ли в полученных координатах или соседних клетках ранее
      // созданных кораблей
      var isValid = this.checkShipCoord(ship)
      // Если координаты повторяются, снова запускаем функцию
      if (!isValid) return this.createShip(len, owner)
      this.locateShip(ship)
      store.ships[owner].push(ship)
    },
    hideDrownShip : function (target, owner, targetName) {
      // Нужно найти корабль с потопленым бортом
      // Пройти по массиву кораблей
      for (var i = 0; i < store.ships[targetName].length; i++) {
        var isHurt   = false,
            drownLen = 0,
            ship     = store.ships[targetName][i]
        // Пройти по бортам выбранного корабля
        for (var j = 0; j < ship.decks.length; j++) {
          var deck = ship.decks[j]
          // если корабль ранен, вернуться и посчитать количество потопленный бортов
          if (deck.x === target.x && deck.y === target.y) {
            isHurt = true
            break
          }
        }

        if (!isHurt) return
        // Если длина корабля равна количеству потопленных бортов
        // значит корабль утонул
        for (var k = 0; k < ship.decks.length; k++) {
          var hurtedShipDeck = ship.decks[k]
          if (store.fields[targetName][hurtedShipDeck.y][hurtedShipDeck.x] === 2) drownLen++
        }

        if (drownLen !== ship.len) return
        // Если корабль утонул
        // отметить границу занятой им зоны
        var square = model.createShipSquare(ship)

        // пройтись по границе и не простреленные ячейки
        // пометить как простреленные
        for (var n = square.fromX; n <= square.toX; n++) {
          for (var m = square.fromY; m <= square.toY; m++) {
            if (store.fields[ship.owner][m][n] === 0) store.fields[targetName][m][n] = 3
          }
        }
      }
    },
    checkShipCoord   : function (ship) {
      var square = model.createShipSquare(ship)
      // Запускаем циклы и проверяем координаты площади
      // если значение равно 1му, значит ячейка занята
      for (var i = square.fromX; i <= square.toX; i++) {
        for (var j = square.fromY; j <= square.toY; j++) {
          if (store.fields[ship.owner][j][i] === 1) return false
        }
      }
      return true
    },
    createShipSquare : function (ship) {
      var fromX, toX, fromY, toY

      // Проверяем начальную позицию

      // Задаём начальную и конечную координаты площади занимаемую кораблём
      // если х корабля = 0, значит корабль примыкает к левому краю поля
      // и значит х площади, тоже начинается с нуля
      fromX = (ship.x === 0) ? ship.x : ship.x - 1
      // Если корабль расположен вертикально
      if (ship.isVertical) {
        // и примыкает к правой границе
        if (ship.x === 9) toX = ship.x
        else toX = ship.x + 1
      }
      // Если корабль расположен горизонтально
      else {
        // и примыкает к правой границе
        if (ship.x + ship.len === 10) toX = 9
        else toX = ship.x + ship.len
      }
      // Задаём начальную и конечную Y координату площади
      fromY = (ship.y === 0) ? ship.y : ship.y - 1
      // Если корабль расположен вертикально
      if (ship.isVertical) {
        // и примыкает к нижней границе
        if (ship.y + ship.len === 10) toY = 9
        else toY = ship.y + ship.len
      }
      // Если корабль расположен горизонтально
      else {
        // и примыкает к нижней границе
        if (ship.y === 9) toY = ship.y
        else toY = ship.y + 1
      }
      return {
        fromX : fromX,
        fromY : fromY,
        toX   : toX,
        toY   : toY,
      }
    },
    locateShip       : function (ship) {
      var field = store.fields[ship.owner]
      // Записываем координаты корабля в поле владельца( owner)
      for (var i = 0; i < ship.len; i++) {
        if (ship.isVertical) {
          store.fields[ship.owner][ship.y + i][ship.x] = 1
        } else {
          store.fields[ship.owner][ship.y][ship.x + i] = 1
        }
      }
      store.fields[ship.owner] = field
    },
    createNavy    : function (owner) {
      for (var i = 0; i < store.series.length; i++) {
        var serie = store.series[i]
        for (var j = 0; j < serie.amount; j++) {
          // Создать корабль
          model.createShip(serie.len, owner)
          // Установить начальное количество живых частей кораблей
          store.result[owner] += serie.len
        }
      }
    },
    createField   : function (owner) {
      var x = 10, y = 10, arr = [10]
      for (var i = 0; i < x; i++) {
        arr[i] = [10]
        for (var j = 0; j < y; j++) {
          arr[i][j] = 0
        }
      }
      store.fields[owner] = arr
    },
    checkResult   : function () {
      if (store.result.user === 0) {
        store.result.winner = store.userName
        view.finishFight()
      } else if (store.result.computer === 0) {
        store.result.winner = store.computerName
        view.finishFight()
      }
    },
  }
  /*////////////////////////////////////////////
  //// util functions
  */////////////////////////////////////////////

  function getRandom(n) {
    // n - максимальное значение, которое хотим получить
    return Math.floor(Math.random() * (n + 1))
  }


  $('#start_form').submit(function (event) {
    event.preventDefault()
    // Get players names
    store.userName = $('#user_name_input').val()
    store.computerName = $('#enemy_name_input').val()
    // Render players names
    $('.description-user').html('Игрок - ' + store.userName)
    $('.description-enemy').html('Противник - ' + store.computerName)
    view.startFight()
    model.created()
    view.showStep('user')

  })
})

