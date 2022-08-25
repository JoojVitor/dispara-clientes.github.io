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

        reader.onload = (function() {
            return function(e) {
                arquivoProcessado = JSON.parse(e.target.result);

                botao = $(".botaoDisparo button");
                if (botao.attr("disabled")) {
                    botao.removeAttr("disabled");
                }

                $("#drop_zone").removeClass("invalido");
                $("#drop_zone p").text("Arquivo carregado com sucesso!");

                alvos = arquivoProcessado;
            };
        })(arquivo);

        reader.readAsText(arquivo);
    }
}

function efetueDisparo() {

    var erros = [];

    alvos["mailing"].forEach(alvo => {
       var body = monteBody(alvo);

       request = new XMLHttpRequest();

        header = {
            "Authorization": `${$("#auth").val()}`,
            "Access-Control-Allow-Origin": "*"
        };

        $.ajax({
            async: false,
            contentType: "application/json",
            data: JSON.stringify(body),
            dataType: "json",
            error: function(textStatus) {
                erros.push({"erro": textStatus["responseJSON"], "alvo": alvo["Telefone"]});
            },
            type: "POST",
            url: "https://sac-mpealgartelecom.ascbrazil.com.br/rest/v1/sendHsm",
            headers: header
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
        "cod_flow": "482",
        "start_flow": 1,
        "variaveis": ["variavelLink"],
        "flow_variaveis": {"idCliente": "53027"},
        "contato": {"telefone": parseInt(`55${alvo["Telefone"]}`), "nome": alvo["nome"]}
    }
}

function download(content, fileName, contentType) {
    var a = document.createElement("a");
    var file = new Blob([content], {type: contentType});
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}