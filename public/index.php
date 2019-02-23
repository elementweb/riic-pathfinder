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

    <div id="pathfinder-debug">
        <fieldset class="debug-controls">
            <legend>Debug/testing</legend>

            <div class="controls">
                <button id="debug-select-random">Select random target</button>
            </div>
        </fieldset>
    </div>

    <div id="pathfinder-controls">
        <fieldset class="simulation-controls">
            <legend>Simulation controls</legend>

            <div class="controls">
                <button id="button-initialize" class="hidden">Initialize</button>
                <button id="button-load-data">Load data</button>
                <button id="button-reset">Reset</button>
                <button id="button-flush-cache">Flush cache & reset</button>
            </div>

            <div class="status"><b>Simulation:</b> <span id="status">waiting</span></div>

            <div class="subjects-loaded">
                <div class="subjects-loaded-heading">Data loaded:</div>
                <div id="exoplanets-loaded"><i class="fa fa-times"></i> Exoplanets</div>
                <div id="neos-loaded"><i class="fa fa-times"></i> NEOs</div>
                <div id="objects-loaded"><i class="fa fa-times"></i> Solar objects</div>
            </div>

            <div class="controls">
                <button id="button-start">Begin</button>
                <button id="button-stop">Stop</button>
            </div>
        </fieldset>

        <fieldset class="operations">
            <legend>Spacecraft operations</legend>

            <div class="status"><b>Operation:</b> <span id="operation-status">idling</span></div>

            <div class="operations-statistics">
                <div>Exoplanets scanned: <span id="exoplanets-scanned">159</span> (~<span id="exoplanets-scanned-avg">2.95</span>/day)</div>
                <div>NEOs scanned: <span id="neos-scanned">339</span> (~<span id="neos-scanned-avg">0.97</span>/day)</div>
                <div>EW scans performed (L+R): <span id="ew-scan-count">679</span></div>
                <div>Data transmitted: <span id="data-transmitted">31</span> (~<span id="neos-scanned-avg">0.23</span>/day)</div>

                <div>AOCS: <span id="aocs-angle-avg">~8.49&deg;/day</span></div>
            </div>
        </fieldset>

        <fieldset class="targeting">
            <legend>Current target</legend>

            <div class="items">
                <div><i class="fa fa-bullseye"></i>&nbsp;&nbsp;Target: <span class="italic" id="target-name">not known</span></div>
                <div><i class="fa fa-star"></i>&nbsp;&nbsp;Host: <span class="italic" id="target-host">not known</span></div>
                <div><i class="fa fa-eye"></i>&nbsp;&nbsp;Optical magnitude: <span class="italic" id="target-optmag">not known</span></div>
                <div><i class="fa fa-clock-o"></i>&nbsp;&nbsp;Integration time: <span class="italic" id="target-integration">not known</span></div>
            </div>
        </fieldset>

        <fieldset class="timing">
            <legend>Timing</legend>

            <div class="items">
                <div>Time ratio: 20:<span id="time-ratio">1</span></div>
                <div>Simulation uptime: <span id="simulation-uptime">2:29</div>
                <div>Spacecraft uptime: <span id="spacecraft-uptime">29 days</div>
            </div>
        </fieldset>
    </div>

    <script src="<?php echo mix('app.js'); ?>"></script>

    <script type="text/javascript">
        App.pathFinder.data.timestamp = '<?php echo time() ?>';
    </script>
</body>
</html>
