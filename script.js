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

                if ($("#botao-disparo button").attr("disabled")) {
                    $("#botao-disparo button").removeAttr("disabled");
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

    if (!$("#auth").val()) {
        abraModalSimples("Campo não preenchido", "Não foi fornecida a ASC Authorization Key.")
        return;
    }

    const proxyUrl = "https://afternoon-sierra-49318.herokuapp.com/";

    $("#barra-progresso").removeAttr("hidden");

    alvos["mailing"].forEach(alvo => {
        count++;

        header = {
            "Authorization": `${$("#auth").val()}`,
        };

        $.ajax({
            async: false,
            crossDomain: true,
            cache: false,
            contentType: "application/json",
            dataType: "json",
            type: "POST",
            data: JSON.stringify(monteBody(alvo)),
            headers: header,
            url: `${proxyUrl}https://sac-mpealgartelecom.ascbrazil.com.br/rest/v1/sendHsm`,

        }).fail(function(textStatus) {
            erros.push({ "erro": textStatus["responseJSON"], "alvo": alvo["Telefone"]});
        }).always(function() {
            progresso = Math.round((count * 100) / alvos["mailing"].length);
            atualizaValorBarraProgresso($("#barra-progresso .progress-bar"), progresso);
            console.log(`opa ${progresso}`);
        });
    });

    if (erros.length > 0) {
        abraModalBaixarRelatorio(erros);
    } else {
        abraModalSimples("Concluído", "Todos os clientes foram disparados com sucesso.")
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

function atualizaValorBarraProgresso(barraProgresso, valor) {
    barraProgresso.attr("style", `width: ${valor}%`);
    barraProgresso.attr("aria-valuenow", `${valor}`);
    barraProgresso.text(`${valor}%`);
}

function abraModalBaixarRelatorio(dadosJSON) {
    BootstrapDialog.show({
        title: "Concluído com falhas",
        message: "O processo foi concluído, mas alguns clientes não foram disparados. Deseja baixar o relatório?",
        animate: true,
        buttons: [{
            label: "Sim",
            action: function(dialog) {
                download(JSON.stringify(dadosJSON), "relatorio.json", "text/plain");
                
                atualizaValorBarraProgresso($("#barra-progresso .progress-bar"), 0);
                resetaView();
                
                dialog.close();
            }
        },
        {
            label: "Não",
            action: function(dialog) {
                atualizaValorBarraProgresso($("#barra-progresso .progress-bar"), 0);
                resetaView();

                dialog.close();
            }
        }]
    });
}

async function abraModalSimples(titulo, mensagem) {
    BootstrapDialog.show({
        title: `${titulo}`,
        message: `${mensagem}`,
        animate: true,
        buttons: [{
            label: 'Fechar',
            action: function(dialog) {
                atualizaValorBarraProgresso($("#barra-progresso .progress-bar"), 0);
                resetaView();

                dialog.close();
            }
        }]
    });
}

function resetaView() {
    $("#botao-disparo button").attr("disabled", "");

    $("#drop-zone").css("border-color", "gray");
    $("#drop-zone p").text("Arraste o arquivo .JSON aqui...");

    //$("#barra-progresso").attr("hidden", "");

    alvos = [];
}

function download(content, fileName, contentType) {
    let a = document.createElement("a");

    a.href = URL.createObjectURL(new Blob([content], { type: contentType }));
    a.download = fileName;
    a.click();
}
