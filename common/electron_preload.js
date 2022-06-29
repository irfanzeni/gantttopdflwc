function stopLoadingThePage(){
	if (process.env.RESOURCE_LOAD_TIMEOUT == -1 ) return;

	var resourceLoadTimeout = process.env.RESOURCE_LOAD_TIMEOUT || 10000;
	if (process.env.PAGE_RENDER_TIMEOUT) resourceLoadTimeout = process.env.PAGE_RENDER_TIMEOUT / 2;
	console.log("electronPreload")
	setTimeout(function(){
		window.stop()
	}, resourceLoadTimeout);

}

stopLoadingThePage()