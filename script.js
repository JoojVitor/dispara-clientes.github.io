var alvos;

function dragOverHandler(ev) {
    ev.preventDefault();
}

function processeArquivo(ev) {
    ev.preventDefault();

    let arquivos = ev.dataTransfer.files;

    for (var i = 0, arquivo; arquivo = arquivos[i]; i++) {

        if (!arquivo.type.match("application/json")) {
            $("#drop-zone p").text("Arquivo não é um JSON!");
            return;
        }

        let reader = new FileReader();

        reader.onload = (function () {
            return function (e) {
                arquivoProcessado = JSON.parse(e.target.result);

                botao = $("#botao-disparo button");
                if (botao.attr("disabled")) {
                    botao.removeAttr("disabled");
                }

                $("#drop-zone").css("border-color", "green");
                $("#drop-zone p").text("Arquivo carregado com sucesso!");

                alvos = arquivoProcessado;
            };
        })(arquivo);

        reader.readAsText(arquivo);
    }
}

function efetueDisparo() {

    let erros = [];
    let progresso = 0;
    let count = 0;

    let barraProgresso = $("#barra-progresso .progress-bar");

    let authKey = $("#auth").val();

    if (authKey === "undefined") {
        $("#modal-alerta .modal-title").text("Falha");
        $("#modal-alerta .modal-body p").text("O campo \"ASC Authorization Key\" não foi preenchido!");

        $("#modal-alerta").modal("show");

        $("#auth").trigger("focus");

        return;
    }

    const proxyUrl = "https://afternoon-sierra-49318.herokuapp.com/";

    alvos["mailing"].forEach(alvo => {
        let body = monteBody(alvo);

        count++;

        request = new XMLHttpRequest();

        header = {
            "Authorization": `${authKey}`,
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

        progresso += Math.round((count * 100) / alvos["mailing"].length);

        barraProgresso.setAttribute("style", `width: ${progresso}`);
        barraProgresso.setAttribute("aria-valuenow", `${progresso}`);
        barraProgresso.textContent = `${progresso}%`;
        barraProgresso.removeAttribute("hidden");
    });

    if (erros.length > 0) {
        download(JSON.stringify(erros), "relatorio_erros.json", "text/plain")
    }

    if (parseInt(barraProgresso.textContent) >= 99) {
        barraProgresso.setAttribute("hidden", "");

        $("#modal-alerta .modal-title").text("Concluído");
        $("#modal-alerta .modal-body p").text("Processo finalizado com sucesso!");

        $("#modal-alerta").on("shown.bs.modal", function () {
            $("#botal-modal").trigger("focus")
        });
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
        "url_file":"https://raw.githubusercontent.com/nicolassegatto/disparadorHSM-JoojVitor/master/img/Sem%20T%C3%ADtulo-2.jpg",
        "tipo_envio": 1,
        "variaveis": [],
        "botoes": ["Sim", "Não"]
    }
}

function download(content, fileName, contentType) {
    let a = document.createElement("a");
    let file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
}
