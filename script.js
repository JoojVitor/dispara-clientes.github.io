let alvos;

function dragOverHandler(ev) {
    ev.preventDefault();
}

function processeArquivo(ev) {
    ev.preventDefault();

    var arquivos = ev.dataTransfer.files;

    for (var i = 0, arquivo; arquivo = arquivos[i]; i++) {

        if (!arquivo.type.match("application/json")) {
            $("#drop_zone p").text("Arquivo não é um JSON!");
            return;
        }

        var reader = new FileReader();

        reader.onload = (function () {
            return function (e) {
                arquivoProcessado = JSON.parse(e.target.result);

                botao = $(".botaoDisparo button");
                if (botao.attr("disabled")) {
                    botao.removeAttr("disabled");
                }

                $("#drop_zone").css("border-color", "green");
                $("#drop_zone p").text("Arquivo carregado com sucesso!");

                alvos = arquivoProcessado;
            };
        })(arquivo);

        reader.readAsText(arquivo);
    }
}

function efetueDisparo() {

    var erros = [];

    const proxyUrl = "https://afternoon-sierra-49318.herokuapp.com/";

    alvos["mailing"].forEach(alvo => {
        var body = monteBody(alvo);

        request = new XMLHttpRequest();

        header = {
            "Authorization": `${$("#auth").val()}`,
        };

        $.ajax({
            async: false,
            contentType: "application/json",
            data: JSON.stringify(body),
            dataType: "json",
            error: function (textStatus) {
                erros.push({ "erro": textStatus["responseJSON"], "alvo": alvo["Telefone"] });
            },
            type: "POST",
            url: `${proxyUrl}https://sac-mpealgartelecom.ascbrazil.com.br/rest/v1/sendHsm`,
            headers: header,
            crossDomain: true
        });
    });

    if (erros.length > 0) {
        download(JSON.stringify(erros), "relatorio_erros.json", "text/plain")
    }
}

function monteBody(alvo) {
    return {
        "cod_conta": 17,
        "hsm": alvo["type"],
        "cod_flow": "711",
        "start_flow": 1,
        "flow_variaveis": { "cpfCnpj": alvo["cpfCnpj"] },
        "contato": { "telefone": parseInt(`55${alvo["Telefone"]}`), "nome": alvo["nome"] },
        "url_file": "https://raw.githubusercontent.com/JoojVitor/dispara-clientes.github.io/master/img/Sem%20T%C3%ADtulo-2.jpg",
        "tipo_envio": 1,
        "botoes": ["Sim", "Não"]
    }
}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
