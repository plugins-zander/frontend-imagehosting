function getDate() {
    let now = new Date();
    let Y = now.getFullYear();
    let M = now.getMonth() + 1;
    let m;
    M < 10 ? m = '0' + M.toString() : m = M.toString();
    return Y.toString() + m
}

function appendKvMain(level, id, content) {
    let kvMain = $(".kv-main");
    kvMain.append('<div class="alert alert-' + level + '" id="' + id + '">' +
        '<a href="#" class="close" data-dismiss="alert"></a><strong>' +
        content + '</strong></div>');
}

function generateImagUrl(id) {
    let domain;
    if ($.cookie("ownDomain")) {
        domain = $.cookie("ownDomain")
    } else {
        domain = $.cookie('bucket') + '.' + $.cookie('region') + '.aliyuncs.com'
    }
    let url = 'https://' + domain + '/' + getDate() + '/' + document.getElementById(id).title;
    let md = '![](' + url + ')';
    if ($.cookie('type') === 'markdown') {
        url = md
    }
    let input = document.getElementById("copy_temp");
    input.value = url; // 修改文本框的内容
    input.select(); // 选中文本
    document.execCommand("copy"); // 执行浏览器复制命令
    $('.alert-success').remove();
    appendKvMain('success', randomStr(), '复制链接成功');
    setTimeout(function () {
        $('.alert-success').alert('close');
    }, 500);
}

function keepCookie() {
    let button = $('.btn-default');
    button.attr("disabled", true);
    $('.alert').remove();
    let msg;
    let variety = ["region", "accessKeyId", "accessKeySecret", "bucket", "ownDomain"];
    for (let i = 0; i < variety.length; i++) {
        let varietyValue = $('#' + variety[i]).val();
        if (!varietyValue && variety[i] !== "ownDomain") {
            msg = variety[i] + ' 不能为空';
            if (msg) {
                break
            }
        } else {
            $.cookie(variety[i], varietyValue, {expires: 365, path: '/'});
        }
    }
    if (!msg) {
        checkOss()
    } else {
        appendKvMain('danger', randomStr(), msg);
        button.removeAttr("disabled");
    }
}

function checkOss() {
    let button = $('.btn-default');
    let client = new OSS({
        region: $.cookie('region'),
        accessKeyId: $.cookie('accessKeyId'),
        accessKeySecret: $.cookie('accessKeySecret'),
        bucket: $.cookie('bucket'),
        secure: true,
        timeout: 2000
    });
    client.list({
        'max-keys': 1
    }).then(function (result) {
        if (button.length) {
            appendKvMain('success', randomStr(), '配置保存成功');
            button.removeAttr("disabled");
        } else {
            $("#smfile").fileinput('enable');
        }
    }).catch(function (err) {
        if (err.toString().indexOf("ConnectionTimeoutError") !== -1) {
            appendKvMain('danger', randomStr(), '连接超时，请检查region和bucket');
        }
        if (err.toString().indexOf("Access Key Id you provided") !== -1) {
            appendKvMain('danger', randomStr(), 'accessKeyId 填写出错');
        }
        if (err.toString().indexOf("signature we calculated") !== -1) {
            appendKvMain('danger', randomStr(), 'accessKeySecret 填写出错');
        }
        button.removeAttr("disabled");
        appendKvMain('danger', randomStr(), err);
    });
}

function checkConfig() {
    $("#smfile").fileinput('disable');
    try {
        new OSS({
            region: $.cookie('region'),
            accessKeyId: $.cookie('accessKeyId'),
            accessKeySecret: $.cookie('accessKeySecret'),
            bucket: $.cookie('bucket'),
        });
        checkOss()
    } catch (e) {
        appendKvMain('danger', randomStr(), '请先对图床进行配置');
    }
}

function uploadImg(e) {
    $('.alert').remove();
    let client = new OSS({
        region: $.cookie('region'),
        accessKeyId: $.cookie('accessKeyId'),
        accessKeySecret: $.cookie('accessKeySecret'),
        bucket: $.cookie('bucket'),
        secure: true
    });
    for (let i = 0; i < e.target.files.length; i++) {
        let file = e.target.files[i];
        let newname = file.lastModified.toString() + file.size.toString() + '.jpg';
        let time = new Date().getTime();
        appendKvMain('info', time, '正在上传文件：' + newname);
        client.multipartUpload(getDate() + '/' + newname, file).then(function (result) {
            console.log(result);
            $('#' + time.toString()).remove();
            appendKvMain('success', time, newname + ' 上传成功');
        }).catch(function errorMsg(err) {
            $('#' + time.toString()).remove();
            appendKvMain('danger', time, newname + '上传失败！ ' + err);
        });
    }
}

function randomStr() {
    return Math.random().toString().slice(2, 8)
}

function checkType() {
    let radio = $(".radio");
    if ($.cookie('type') === 'url') {
        radio.append('<label><input type="radio" name="type" checked/>url</label>\n' +
            '<label><input type="radio" name="type" id="markdown"/>markdown</label>')
    } else {
        radio.append('<label><input type="radio" name="type"/>url</label>\n' +
            '<label><input type="radio" name="type" checked/>markdown</label>')
    }
}

$(function () {
    if (!$.cookie('type')) {
        $.cookie('type', 'markdown', {expires: 365, path: '/'})
    }
    checkType();
    $('[type=radio][name=type]').change(function () {
        $.cookie('type', $(this).parent()[0].innerText, {expires: 365, path: '/'})
    })
});
