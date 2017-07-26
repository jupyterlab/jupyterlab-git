define(['jquery', 'base/js/utils'], function ($, utils) {

    var $ = require('jquery');
    var Jupyter = require('base/js/namespace');
    var utils = require('base/js/utils');

    //var ajax = $.ajax;

    var base_url = utils.get_body_data('baseUrl');

    function open_rsession() {

        var rsp_url = base_url + '/git_handler';
        console.log("Let's Go and test it!!!!!!!!!!00000");

        var settings = {
            type: "POST",
            data: {},
            dataType: "json",
            success: function(data) {
                console.log("Data drop to server Success");
            },
            error : utils.log_ajax_error,
        }
        console.log("Let's Go and test it!!!!!!!!!!111111");
        $.ajax(rsp_url, settings);


        console.log("Let's Go and test it!!!!!!!!!!2223334");
    }
   
    function load() {
        console.log("Let's Go and test it!!!!!!!!!!");
        
    }

    return {
        load_ipython_extension: load
    };
});