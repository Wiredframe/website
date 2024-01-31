/*
* Formy JS library
* by Luiszuno.com
*/
 
 jQuery(document).ready(function($) {

	// Hide messages 
	$("#formy-success").hide();
	$("#formy-error").hide();
	
	// on submit...
	$("#formy #submit").click(function() {
		
		// Required fields:
		
		//name
		var name = $("#name").val();
		if(name == "" || name == "Ihr Name"){
			$("#name").focus();
			$("#formy-error").fadeIn().text("Name eingeben");
			return false;
		}
		
		// email
		var email = $("#email").val();
		if(email == "" || email == "Ihre Email Adresse"){
			$("#email").focus();
			$("#formy-error").fadeIn().text("Email eingeben");
			return false;
		}
				
		// comments
		var comments = $("#comments").val();
		if(comments == "" || comments == "Geben Sie hier Ihre Nachricht ein..."){
			$("#comments").focus();
			$("#formy-error").fadeIn().text("Nachricht eingeben");
			return false;
		}
		
		// send mail php
		var sendMailUrl = $("#sendMailUrl").val();
		
		// Retrieve values for to, from & subject at the form
		var to = $("#to").val();
		var from = $("#from").val();
		var subject = $("#subject").val();
		
		// Create the data string
		var dataString = 'name='+ name
						+ '&email=' + email        
						+ '&comments=' + comments
						+ '&to=' + to
						+ '&from=' + from
						+ '&subject=' + subject;						         
		// ajax 
		$.ajax({
			type:"POST",
			url: sendMailUrl,
			data: dataString,
			success: success()
		});
	});  
		
		
	// On success...
	 function success(){
	 	$("#formy-success").fadeIn().text("Ihre Nachricht wurde versandt!");
	 	$("#formy-error").hide();
	 	$("#formy fieldset").fadeOut();
	 }
	
    return false;
});


// Clears the label of the input on focus

function defaultInput(target, string){
	if((target).value == string){(target).value=''}
}

function clearInput(target, string){
	if((target).value == ''){(target).value=string}
}
