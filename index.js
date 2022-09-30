class MayIScore {

	constructor() {
		this.numberOfPlayers = 1;
		this.roundNumber = 0;
		this.playerScores = new Array(1);
		this.playerScores[0] = new Array();

		this.prepopulateData();
	}

	get MAX_ROUNDS() {
        return 7;
    }

    prepopulateData() {
    	if(localStorage.getItem('names') && localStorage.getItem('scores')) {
    		this.loadPreviousData();
    	}
    }

    loadPreviousData() {
    	const players = JSON.parse(localStorage.getItem('names'));
    	const scores = JSON.parse(localStorage.getItem('scores'));

    	this.addPlayersFromMemory(players);
    	this.addScoresFromMemory(scores);
    	this.updateTotalScores();
    }

    addPlayersFromMemory(players) {
    	players.forEach((name, index) => {
    		if(index != 0) {
    			this.addPlayer();
    		}
    		$(`#playerName${index + 1}`).text(name);
    	});
    }

    addScoresFromMemory(scores) {
    	this.addScoreRows(scores);
    	this.populateScores(scores);
    }

    addScoreRows(scores) {
    	scores[0].forEach(() => {
    		this.enterNewScores();
    	});
    }

    populateScores(scores) {
    	scores.forEach((scoreArr, playerIndex) => {
    		scoreArr.forEach((roundScore, roundIndex) => {
    			$(`#player${playerIndex}Round${roundIndex + 1}Score`).val(roundScore);
    		});
    	});
    }

    addListeners() {
    	$('#addPlayer').on("click", $.proxy(this.addPlayer, this));
		$('#enterNewScores').on("click", $.proxy(this.enterNewScores, this));
		$(document).on('change', $.proxy(this.updateTotalScores, this));
		let that = this;
		$('body').on('click', '[data-editable]', function()  {
		  
		  let $el = $(this);
		  const id = $el.attr('id');
		              
		  let $input = $('<input/>').val( $el.text() );
		  $el.replaceWith( $input );
		  
		  let save = () => {
		  	//Hacky way to remove last player if needed
		  	if($input.val().toLowerCase() === "delete" && id === `playerName${that.numberOfPlayers}`) {
			    $input.remove();
			    $(`#player${that.numberOfPlayers}TotalScore`).remove();
			    that.numberOfPlayers--;
			} else {
				let $button = $(`<button id="${id}" class="playerName pure-button" data-editable />`).text( $input.val() );
			    $input.replaceWith( $button );
			} 
		  };
		  
		  $input.one('blur', save).select();
		  
		});
	}

	addPlayer() {
		$(`#playerName${this.numberOfPlayers}`).after($(`<button id="playerName${++this.numberOfPlayers}" class="playerName pure-button" data-editable>*Name</button>`));
		$(`#player${this.numberOfPlayers - 1}TotalScore`).after($(`<div id="player${this.numberOfPlayers}TotalScore" class="totalScoreDisplay">0</div>`));

		this.playerScores.push(new Array());
	}

	enterNewScores() {
		this.roundNumber++;

		this.createScoreBoxes()
		
	}

	createScoreBoxes() {
		this.createScoresContainer();
		this.addScoreElements();
		if(this.roundNumber === this.MAX_ROUNDS) {
			this.addSubmitButton();
		}
	}

	createScoresContainer() {
		if(this.roundNumber === 1) {
			$('#totalScores').after($(`<div id="scoresContainer${this.roundNumber}"/>`));
		} else {
			$(`#scoresContainer${this.roundNumber - 1}`).after($(`<div id="scoresContainer${this.roundNumber}"/>`));
		}
	}

	addScoreElements() {
		let $container = $(`#scoresContainer${this.roundNumber}`);

		for(let i = 0; i < this.numberOfPlayers; i++) {
			$container.append($(`<input id="player${i}Round${this.roundNumber}Score" class="scoreInput" type="number" value="0"/>`))
		}
	}

	addSubmitButton() {
		$('#enterNewScores').after($('<button id="submitScores" class="pure-button pure-button-primary">Send Scores</button>'));
		$('#enterNewScores').remove();

		$('#submitScores').on('click', $.proxy(this.submitScore, this));
	}

	submitScore(e) {
		let data = {
			date: new Date(),
			rowData: {}
			//Can add number of caught here, or other stats
		};
		let winner = {
			player: "none",
			score: 2000
		};

		const $playerArray = this.getPlayerArray();

		const playersTotalScores = this.playerScores.map(arr => arr.reduce((a, b) => a + b, 0));

		const winnerIndex = playersTotalScores.indexOf(Math.min(...playersTotalScores));

		data['rowData']['players'] = $playerArray;
		data['rowData']['rawScores'] = this.playerScores;
		data['rowData']['playersTotalScores'] = playersTotalScores;
		data['rowData']['winnerIndex'] = winnerIndex;

		$.ajax({
		    url: "https://h2xg3pt368.execute-api.us-west-1.amazonaws.com",
		    type: 'POST',
		    data: JSON.stringify(data),
		    crossDomain: true,
		    success: (res) => {
		        console.log(res);
		        $('#submitScores').after($(`<div>${res}</div>`));
		        $('body').addClass('success');
		        localStorage.clear();
		    },
		    error: (err) => {
		    	$('#submitScores').after($(`<div>${JSON.stringify(err)}</div>`));
		    	$('body').addClass('failure');
		    }
		});
	}

	updateTotalScores() {
		this.zeroOutPlayerScores();
		$('[id^="scoresContainer"]').each((index, scoreContainer) =>{
			let scores = scoreContainer.children;
			for( let i = 0; i < scores.length; i++) {
				this.playerScores[i][index] = parseInt(scores[i].value);
			}
		});

		this.saveScoresLocally();
		this.displayScoreTotals();
	}

	zeroOutPlayerScores() {
		this.playerScores.forEach((el, index, ar) => { 
			ar[index] = [];
		});
	}

	saveScoresLocally() {
		localStorage.setItem('names', JSON.stringify(this.getPlayerArray()));
		localStorage.setItem('scores', JSON.stringify(this.playerScores));
	}

	displayScoreTotals() {
		for(let i = 0; i < this.numberOfPlayers; i++) {
			$(`#player${i + 1}TotalScore`).text(this.playerScores[i].reduce((a, b) => a + b, 0));
		}
	}

	getPlayerArray() {
		return $('#nameContainer').find('button.playerName').map((index, element) => {
			return element.innerText;
		}).get();
	}
}

const mayI = new MayIScore();
mayI.addListeners();