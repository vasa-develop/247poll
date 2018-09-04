var firestore = firebase.firestore();
const settings = {timestampsInSnapshots: true}
firestore.settings(settings);

function signIn(){
	if(!isUserSignedIn()){
	var provider = new firebase.auth.GoogleAuthProvider();
	provider.addScope('https://www.googleapis.com/auth/appstate');
	//provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
	firebase.auth().useDeviceLanguage();
	provider.setCustomParameters({
	  'login_hint': 'user@example.com'
	});

	

	firebase.auth().signInWithPopup(provider).then(function(result) {
	  // This gives you a Google Access Token. You can use it to access the Google API.
	  var token = result.credential.accessToken;
	  // The signed-in user info.
	  var user = result.user;
	  
	  console.log("User: "+user.uid);
	  //console.log("Access Token: "+result.credential.accessToken);

	  initializeUser(user.uid);
	  // ...
	}).catch(function(error) {
	  // Handle Errors here.
	  var errorCode = error.code;
	  var errorMessage = error.message;
	  // The email of the user's account used.
	  var email = error.email;
	  // The firebase.auth.AuthCredential type that was used.
	  var credential = error.credential;
	  // ...
	});
	}
	else{	
		checkStatus();
	}
}

// Returns true if a user is signed-in.
function isUserSignedIn() {
  return !!firebase.auth().currentUser;
}

function checkStatus(){
	var status = document.getElementById("auth");
	if(!isUserSignedIn()){
		status.innerHTML = 'SignIn';
	}else{
		status.innerHTML = 'Happy Polling!'
	}
}

function initializeUser(uid){
	var userDocRef = firestore.doc("users/"+uid);

	userDocRef.set({
		"userId": uid,
		"joinedOn": firebase.firestore.FieldValue.serverTimestamp(),
		"polls_voted": []
	}).then(()=>{
		console.log("User added to database.");
	}).catch((error)=>{
		console.log("Some error occured while adding user to database: "+error);
	});
}

function newPoll(){
	if(isUserSignedIn()){
		document.getElementById("new_poll_form").style.visibility = "visible";
	}else{
		alert("Login to add Poll.");
	}
}



function addPoll(){
	
	if(isUserSignedIn()){
	const id = makeid();
	
	var pollTitle = document.getElementById("title").value;
	var pollBody = document.getElementById("body").value;
	pollOptions = document.getElementById("options").value;
	
	var data = {};
	pollOptions.split('~').forEach(function(x){data[x] = 0})	

	var userDocRef = firestore.doc("polls/"+id);

	userDocRef.set({
		"pollId": id,
		"poll_Title": pollTitle,
		"poll_body": pollBody,
		"created by": "vasa",
		"poll_options": data,
		"expires": firebase.firestore.FieldValue.serverTimestamp()
	}).then(() => {
		console.log("Poll saved to database.");
	}).catch((error)=>{
		console.log("Some error occured while saving poll to database: "+error);
	});
	
	}else{
		alert('Login first to add poll.')
	}

	document.getElementById("new_poll_form").style.visibility = "hidden";
}


function vote(id, option){

	if(isUserSignedIn()){

		var userRef = firestore.doc("users/"+firebase.auth().currentUser.uid);
		userRef.get().then((userDoc)=>{
			if(userDoc && userDoc.exists){
				var userData = userDoc.data();
				if(userData.polls_voted.includes(id)){
					alert("You have already voted for this poll.");
				}else{
					var userDocRef = firestore.doc("polls/"+id);


					userDocRef.get().then((doc) => {
						if(doc && doc.exists){
							var doc = doc.data();
							/*console.log("DOC: "+doc.pollId);*/
							var myData = doc.poll_options;
							/*console.log("DATA: "+myData);*/
							myData[option] = myData[option] + 1;
							userDocRef.update({"poll_options": myData}).then(() => {
								console.log("vote successfully saved to database.");
								var newList = userData.polls_voted;
								newList.push(id);
								userRef.update({"polls_voted": newList}).then(()=>{
									console.log("successfully added to voted list.");
								}).catch((error)=>{
									console.log("Some error occured while saving voted list to database: "+error);
								});

							}).catch((error)=>{
								console.log("Some error occured while saving vote to database: "+error);
							});
						}else{
							console.log("Your are trying to vote on a non-existent poll.");
						}
					});
				}
			}
		});

	}else{
		alert("Login to vote.");
	}
}

function getPolls(){

	firestore.collection("polls").onSnapshot(function(querySnapshot) {
		var poll_list = document.getElementById("poll_list");
		var list = "";
	    querySnapshot.forEach(function(doc) {
	    	if(doc && doc.exists){
	        // doc.data() is never undefined for query doc snapshots
	        var myData = doc.data();
	        list = list + '<div class="card"><div class="card-body"><h4>'+myData.poll_Title+'</h4><br>'+myData.poll_body+'<br>';
        	for(var key in myData.poll_options){
        		if (myData.poll_options.hasOwnProperty(key)) {
				    var val = myData.poll_options[key];
				    list = list + '<button type="button" class="btn btn-primary" onclick="vote(\''+myData.pollId+'\',\''+key+'\')">'+key+' ('+val+')'+'</button>&nbsp;&nbsp;&nbsp;'
				  }
        	}

        	list = list + '</div></div><br>';      
	        
	        }
	        
	    });
	    poll_list.innerHTML = list;
	});
	checkStatus();
}

function makeid() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (var i = 0; i < 16; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}


