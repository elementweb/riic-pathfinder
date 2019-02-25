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

    <div id="performance-container" class="hidden">
        <div>Speed: <span class="perf-spacer"><span id="performance-itps">0</span> ips</span></div>
        <div>Timestep: <span class="perf-spacer"><span id="performance-timestep">0</span> sec</span></div>
    </div>

    <div id="loading-indicator">
        <i class="fa fa-cog fa-spin"></i> loading...
    </div>

    <div id="visualisation-status" class="hidden">
        <i class="fa fa-eye-slash"></i> visualisation suspended
    </div>

    <div id="pathfinder-debug">
        <fieldset class="debug-controls">
            <legend>Debug/testing</legend>

            <div class="controls">
                <button id="debug-select-random">Select random target</button>
            </div>

            <div class="items">
                <div>Last message: <span class="italic" id="debug-last-message">-</span></div>
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

            <div class="status"><b>Simulation:</b> &nbsp;&nbsp;<span id="status">waiting</span></div>

            <div class="subjects-loaded">
                <div class="subjects-loaded-heading">Data loaded:</div>
                <div id="exoplanets-loaded" class="subject-state"><i class="fa fa-times"></i> Exoplanets</div>
                <div id="neos-loaded" class="subject-state"><i class="fa fa-times"></i> NEOs</div>
                <div id="objects-loaded" class="subject-state"><i class="fa fa-times"></i> Solar objects</div>
            </div>

            <div class="controls">
                <button id="button-start">Begin</button>
                <button id="button-stop">Stop</button>
            </div>
        </fieldset>

        <fieldset class="settings">
            <legend>Simulations settings</legend>

            <div class="setting">
                Use visualisation: <input type="radio" name="use-plot" value="1" checked> Yes <input type="radio" name="use-plot" value="0"> No (~2% faster data processing)
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
                <div>Exoplanets in scope: <span id="exoplanets-scope">0</span></div>
            </div>
        </fieldset>

        <fieldset class="targeting">
            <legend>Last scanned target information</legend>

            <div id="exoplanet-target-info" class="subject items hidden">

                <table class="target-parameters">
                    <tr>
                        <td>
                            <div class="parameter">
                                <div class="parameter-header">Target planet</div>
                                <div id="exoplanet-name" class="parameter-value">
                                </div>
                                <span id="exoplanet-id" class="parameter-value"></span>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Target host star</div>
                                <div id="exoplanet-host" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Planet radius</div>
                                <div id="exoplanet-plrad" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Star radius</div>
                                <div id="exoplanet-strad" class="parameter-value"></div>
                            </div>
                        </td>

                        <td>
                            <div class="parameter">
                                <div class="parameter-header">Optical magnitude</div>
                                <div id="exoplanet-optmag" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Integration time</div>
                                <div id="exoplanet-integration" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Transit duration</div>
                                <div id="exoplanet-transit" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Orbital period</div>
                                <div id="exoplanet-period" class="parameter-value"></div>
                            </div>
                        </td>

                        <td>
                            <div class="parameter">
                                <div class="parameter-header">RIIC spectroscopies</div>
                                <div id="exoplanet-spectnum" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Spectral Type</div>
                                <div id="exoplanet-class" class="parameter-value"></div>
                                <span class="link"><a href="https://sites.uni.edu/morgans/astro/course/Notes/section2/spectraltemps.html" target="_blank"><i class="fa fa-question-circle-o"></i></a></span>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Class measurements</div>
                                <div id="exoplanet-classnum" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Planet status</div>
                                <div id="exoplanet-status" class="parameter-value"></div>
                            </div>
                        </td>

                        <td>
                            <div class="parameter">
                                <div class="parameter-header">Equ. temperature</div>
                                <div id="exoplanet-equilibrium" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Distance</div>
                                <div id="exoplanet-distance" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Discovery method</div>
                                <div id="exoplanet-method" class="parameter-value"></div>
                                <span class="link"><a href="https://exoplanets.nasa.gov/5-ways-to-find-a-planet" target="_blank"><i class="fa fa-question-circle-o"></i></a></span>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Year of discovery</div>
                                <div id="exoplanet-discovery" class="parameter-value"></div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <div id="neo-target-info" class="subject items hidden">
<!--                 <div><i class="fa fa-bullseye"></i>&nbsp;&nbsp;Target: <span class="italic" id="neo-name">not known</span></div>
                <div><i class="fa fa-eye"></i>&nbsp;&nbsp;Optical magnitude: <span class="italic" id="neo-optmag">not known</span></div>
                <div><i class="fa fa-clock-o"></i>&nbsp;&nbsp;Integration time: <span class="italic" id="neo-integration">not known</span></div> -->
            </div>

            <div id="unknown-target-info" class="subject">
                No target selected
            </div>
        </fieldset>

<!--         <fieldset class="timing">
            <legend>Timing</legend>

            <div class="items">
                <div>Time ratio: 20:<span id="time-ratio">1</span></div>
                <div>Simulation uptime: <span id="simulation-uptime">2:29</div>
                <div>Spacecraft uptime: <span id="spacecraft-uptime">29 days</div>
            </div>
        </fieldset> -->
    </div>

    <script src="<?php echo mix('app.js'); ?>"></script>

    <script type="text/javascript">
        App.pathFinder.data.timestamp = '<?php echo time() ?>';
    </script>
</body>
</html>
