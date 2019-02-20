<?php include 'includes/mix.php';?>
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>RIIC Pathfinder Tool</title>

    <meta name="description" content="" />
    <meta name="keywords" content="" />
    <meta name="author" content="Kostas Gliozeris" />

    <link rel="shortcut icon" href="favicon.png">

    <link href="<?php echo mix('app.css'); ?>" rel="stylesheet">

    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
</head>
<body id="body-layout-main">
    <div id="chart-container"></div>

    <div id="loading-indicator">
        <i class="fa fa-cog fa-spin"></i> loading...
    </div>

    <div id="pathfinder-controls">
        <fieldset class="simulation-controls">
            <legend>Simulation controls</legend>

            <div class="controls">
                <button id="button-initialize">Initialize</button>
                <button id="button-load-data">Load data</button>
                <button id="button-flush-cache">Flush cache & reset</button>
                <button id="button-reset">Reset</button>
            </div>

            <div class="status"><b>Simulation:</b> <span id="status">waiting</span></div>

            <div class="subjects-loaded">
                <div class="subjects-loaded-heading">Data loaded:</div>
                <div id="exoplanets-loaded"><i class="fa fa-times"></i> Exoplanets</div>
                <div id="neos-loaded"><i class="fa fa-times"></i> NEOs</div>
                <div id="objects-loaded"><i class="fa fa-times"></i> Solar objects</div>
            </div>
        </fieldset>

        <fieldset class="operations">
            <legend>Spacecraft operations</legend>

            <div class="controls">
                <button id="button-start">Start</button>
                <button id="button-stop">Stop</button>
            </div>

            <div class="status"><b>Operation:</b> <span id="operation-status">idling</span></div>

            <div class="operations-statistics">
                <div>Exoplanets scanned: <span id="exoplanets-scanned">159</span> (~<span id="exoplanets-scanned-avg">2.95</span>/day)</div>
                <div>NEOs scanned: <span id="neos-scanned">31</span> (~<span id="neos-scanned-avg">0.23</span>/day)</div>

                <div>AOCS: <span id="aocs-angle-avg">~8.49&deg;/day</span></div>
            </div>
        </fieldset>
    </div>

    <script src="<?php echo mix('app.js'); ?>"></script>

    <script type="text/javascript">
        App.pathFinder.data.timestamp = '<?php echo time() ?>';
    </script>
</body>
</html>
