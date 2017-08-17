$(function(){
	$.validator.addMethod('strongPassword', function(value,element){
		return this.optional(element) 
	    || value.length >= 6
	    && /\d/.test(value)
	    && /[a-z]/i.test(value);
	}, 'Your password must be at least 6 charachters long and contain at least one number.')
	$("#register-form").validate({
		rules: {
			email: {
				required: true,
				email: true
			},
			names: {
				required: true
			},
			password: {
				required: true,
				strongPassword: true
			},
			password_conf: {
				required: true,
				equalTo: password
			}
		},
		messages: {
			email: {
				required: 'Please enter an email address',
				email: 'Please enter a <em>valid</em> email address'
			},
			names: {
				required: 'Please enter a name'
			},
			password: {
				required: 'Please enter a password'
			},
			password_conf: {
				required: 'Please enter your password again',
				equalTo: 'Please enter the same password'
			}
		}
	})
})

function remoteValidate(typedIn){
	console.log("called")
	$.post('/validation',{typedIn: typedIn}, function(data,status){
		$(".validation").text(data)
	    $(".validation").show();
	})
}

$("#email1").click(function(){
	$(".validation").hide()
})