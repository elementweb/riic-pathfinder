<?php include 'includes/mix.php';?>
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>RIIC Pathfinder</title>

    <meta name="description" content="" />
    <meta name="keywords" content="" />
    <meta name="author" content="Kostas Gliozeris" />

    <link rel="shortcut icon" href="favicon.png">

    <link href="<?php echo mix('app.css'); ?>" rel="stylesheet">
    <link href="jquery-ui.min.css" rel="stylesheet">

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

    <div id="pathfinder-output">
        <div class="output-panel" id="pathfinder-output-settings" v-cloak>
            <ul class="nav nav-tabs">
                <li><a data-toggle="tab" href="#panel-simulation" class="active">Simulation settings</a></li>
                <li><a data-toggle="tab" href="#panel-export">Data export</a></li>
                <li><a data-toggle="tab" href="#panel-about">About</a></li>
            </ul>

            <div class="tab-content">
                <div id="panel-simulation" class="tab-pane active">
                    <div class="setting">
                        Simulation timestep (seconds):

                        <input type="number" v-model="simulation.timestep" min="10" max="20000" step="10" style="width: 55px;">

                        (60 - optimum, lower = better accuracy)
                    </div>

                    <div class="setting">
                        Use visualisation:

                        <input type="radio" v-model="simulation.visualisation" id="suv1" value="1"><label for="suv1">Yes</label>
                        <input type="radio" v-model="simulation.visualisation" id="suv0" value="0"><label for="suv0">No (faster data processing)</label>
                    </div>

                    <div class="setting">
                        Plot refresh rate:

                        <input type="number" v-model="simulation.refresh_rate" min="1" max="20000" step="1" style="width: 55px;">
                    </div>
                </div>

                <div id="panel-export" class="tab-pane">
                    <button id="scan-data-json-export">Export as JSON</button>

                    <button id="scan-data-visualize">Visualise</button>

                    <form action="action.php" method="post" target="_blank">
                        <input type="hidden" name="something" value="some value">
                    </form>
                </div>

                <div id="panel-about" class="tab-pane">
                    <div class="credits">Source code available on <a href="https://github.com/elementweb/riic-pathfinder" target="_blank"><i class="fa fa-github"></i> GitHub</a></div>
                </div>
            </div>
        </div>
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
            &nbsp;&nbsp;
            <div class="status"><b>Operation:</b> &nbsp;&nbsp;<span id="operation-status">idling</span></div>

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

        <div class="settings-panel" id="pathfinder-settings" v-cloak>
            <ul class="nav nav-tabs">
                <li><a data-toggle="tab" href="#panel-general" class="active">General</a></li>
                <li><a data-toggle="tab" href="#panel-spectroscopy">Spectroscopy</a></li>
                <li><a data-toggle="tab" href="#panel-neos">NEOs</a></li>
                <li><a data-toggle="tab" href="#panel-exoplanets">Exoplanets</a></li>
                <li><a hidden data-toggle="tab" href="#panel-ew">Early-warning</a></li>
                <li><a hidden data-toggle="tab" href="#panel-comms" :class="capacity_recommendation > 0 ? 'tab-warning' : ''">Data & comms</a></li>
            </ul>

            <div class="tab-content">
                <div id="panel-general" class="tab-pane active">
                    <div class="setting">
                        Start date:

                        <input type="text" id="simulation-start-date" value="<?php echo date("j F Y", $time = strtotime('today midnight')) ?>">
                    </div>

                    <div class="setting">
                        Mission lifetime:

                        <input id="mission-lifetime-days" style="width: 55px;" type="number" v-model="general.lifetime_days" min="1" step="1" :disabled="simulation_initialized"> days
                    </div>

                    <div class="setting">
                        Automatically stop at the end:

                        <input type="checkbox" v-model="general.stop_at_the_end" :disabled="lifetime_exceeded">
                    </div>
                </div>

                <div id="panel-spectroscopy" class="tab-pane">
                    <div class="setting">
                        Telescope:

                        <span id="telescope-selection">
                            <input type="radio" id="ts1" v-model="spectroscopy.telescope" value="1"><label for="ts1">⌀0.3m</label>
                            <input type="radio" id="ts2" v-model="spectroscopy.telescope" value="2"><label for="ts2">⌀0.4m</label>
                            <input type="radio" id="ts3" v-model="spectroscopy.telescope" value="3"><label for="ts3">⌀0.5m</label>
                        </span>
                    </div>

                    <div class="setting">
                        Data rate (Mbps):

                        <input style="width: 50px;" type="number" v-model="spectroscopy.data_rate" min="0.1" max="20" step="0.1">

                        with fluctuation (&plusmn;Mbps):

                        <input type="number" v-model="spectroscopy.data_rate_fluct" min="0" max="10" step="0.01" style="width: 45px;">
                    </div>

                    <div class="setting">
                        Scan cool-down period (min):

                        <input style="width: 50px;" type="number" v-model="spectroscopy.cool_down_minutes" min="0" max="360" step="1">
                    </div>

                    <div class="setting">
                        Earth exclusion zone (&deg;):

                        <input style="width: 50px;" type="number" v-model="spectroscopy.earth_exclusion_deg" min="0" max="40" step="1">
                    </div>
                </div>

                <div id="panel-ew" class="tab-pane">
                    <div class="setting">
                        Enable EW scans:

                        <input type="checkbox" v-model="ew.enabled">
                    </div>

                    <div class="setting">
                        Scan rate:

                        <input style="width: 30px;" type="number" v-model="ew.freq_times" min="1" step="1">

                        time(s) per

                        <input style="width: 35px;" type="number" v-model="ew.freq_timeframe_hours" min="6" step="1"> hours
                    </div>

                    <div class="setting">
                        Scan length:

                        <input style="width: 50px;" type="number" v-model="ew.scan_length" min="1" step="1"> minutes
                    </div>

                    <div class="setting">
                        Data rate (Mbps):

                        <input style="width: 50px;" type="number" v-model="ew.data_rate" min="0.1" max="20" step="0.1">

                        with fluctuation (&plusmn;Mbps):

                        <input type="number" v-model="ew.data_rate_fluct" min="0" max="10" step="0.01" style="width: 45px;">
                    </div>

                    <div class="setting">
                        Scan cool-down period (min):

                        <input style="width: 50px;" type="number" v-model="ew.cool_down_minutes" min="0" max="360" step="1">
                    </div>
                </div>

                <div id="panel-neos" class="tab-pane">
                    <div class="setting">
                        Scan NEOs:

                        <input type="checkbox" v-model="neos.scan">
                    </div>

                    <div class="setting">
                        Limit scans by:

                        <input type="radio" id="neosl1" v-model="neos.limiting_by" value="1"><label for="neosl1">Integration time</label>
                        <input type="radio" id="neosl2" v-model="neos.limiting_by" value="2"><label for="neosl2">Visual magnitude</label>
                    </div>

                    <div class="setting">
                        Limiting integration time:

                        <input style="width: 50px;" type="number" v-model="neos.limiting_integration" min="1" step="1" :disabled="neos.limiting_by == 2"> minutes
                    </div>

                    <div class="setting">
                        Limiting visual magnitude:

                        <input style="width: 50px;" type="number" v-model="neos.limiting_vmag" min="0.1" max="40" step="0.1" :disabled="neos.limiting_by == 1">
                    </div>

                    <div class="setting">
                        Scanning:

                        <input type="radio" id="neosd2" v-model="neos.scan_method" value="2"><label for="neosd2">scan each only once</label>

                        <input type="radio" id="neosd1" v-model="neos.scan_method" value="1"><label for="neosd1">delay between single target scans</label>

                        <input style="width: 50px;" type="number" v-model="neos.scan_delay" min="1" step="1" :disabled="neos.scan_method == 2"> days
                    </div>
                </div>

                <div id="panel-exoplanets" class="tab-pane">
                    <div class="setting">
                        Scan exoplanets:

                        <input type="checkbox" v-model="exoplanets.scan">
                    </div>

                    <div class="setting">
                        Scanning:

                        <input type="radio" id="exosd2" v-model="exoplanets.scan_method" value="2"><label for="exosd2">scan each only once</label>

                        <input type="radio" id="exosd1" v-model="exoplanets.scan_method" value="1"><label for="exosd1">delay between single target scans</label>

                        <input style="width: 50px;" type="number" v-model="exoplanets.scan_delay" min="1" step="1" :disabled="exoplanets.scan_method == 2"> days
                    </div>
                </div>

                <div id="panel-comms" class="tab-pane">
                    <div class="setting">
                        Simulate comms:

                        <input type="checkbox" v-model="comms.enabled">
                    </div>

                    <div class="setting">
                        Communication rate:

                        <input style="width: 30px;" type="number" v-model="comms.freq_times" min="1" step="1">

                        time(s) per

                        <input style="width: 35px;" type="number" v-model="comms.freq_timeframe_hours" min="6" step="1"> hours
                    </div>

                    <div class="setting">
                        Data storage capacity (Gb):

                        <input type="number" v-model="comms.data_capacity" min="10" max="10000" step="10" style="width: 55px;">

                        <span class="label-warning" v-if="capacity_recommendation > 0">storage capacity exceeded, increase to at least <span>{{ capacity_recommendation }}</span>Gb</span>
                    </div>

                    <div class="setting">
                        Data transmission speed (Mbps):

                        <input type="number" v-model="comms.transmission_rate" min="0.1" max="100" step="0.1" style="width: 45px;">

                        with fluctuation (&plusmn;Mbps):

                        <input type="number" v-model="comms.transmission_rate_fluct" min="0" max="10" step="0.01" style="width: 45px;">
                    </div>

                    <div class="setting">
                        Min contact time:

                        <input type="number" v-model="comms.transmission_min_contact" min="1" max="60" step="1" style="width: 35px;"> minutes
                    </div>

                    <div class="setting">
                        Cool-down period (min):

                        <input style="width: 50px;" type="number" v-model="comms.cool_down_minutes" min="0" max="360" step="1">
                    </div>
                </div>
            </div>
        </div>

        <fieldset class="operations">
            <legend>Spacecraft operations</legend>

            <div class="operations-statistics">
                <div>
                    <span class="statistics-key">Mission lifetime:</span>
                    <!-- <span id="mission-lifetime">0</span> days -->
                    <div class="progress mission-lifetime-progress">
                        <div class="progress-bar progress-bar-striped active" role="progressbar" id="mission-lifetime" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                    </div>
                </div>

                <div hidden>
                    <span class="statistics-key">Data storage:</span>
                    <div class="progress data-storage-progress">
                        <div class="progress-bar progress-bar-striped active" role="progressbar" id="data-storage" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                    </div>
                </div>

                <div><span class="statistics-key">Exoplanets in scope:</span><span id="exoplanets-scope">0</span></div>

                <div><span class="statistics-key">NEO scans:</span><span id="counter-neos_scanned">0</span> (<span id="stats-neos_per_day">0</span> per day)</div>
                <div><span class="statistics-key">Exoplanets scans:</span><span id="counter-exoplanets_scanned">0</span> (<span id="stats-exoplanets_per_day">0</span> per day)</div>

                <div hidden><span class="statistics-key">Total integration time:</span><span id="stats-total_integration_time">0.00</span> hours (<span id="stats-avg_int_time">0.00</span>hr per scan, <span id="stats-avg_int_time_day">0.00</span>hr per day)</div>
                <div hidden><span class="statistics-key">Total AOCS:</span><span id="stats-total_aocs_change">0.00</span>&deg; (<span id="stats-avg_aocs_change">0</span>&deg;/day)</div>
                <div><span class="statistics-key">Max slew rate:</span><span id="stats-max_slew_rate">0.00</span>&deg;/hr</div>

                <div><span class="statistics-key">Total data generated:</span><span id="stats-total_data_produced">0.00</span> Tb</div>
            </div>
        </fieldset>

        <fieldset class="targeting" style="min-height: 225px;">
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
                                <div class="parameter-header">Est. integration time</div>
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
                <table class="target-parameters">
                    <tr>
                        <td>
                            <div class="parameter">
                                <div class="parameter-header">Object name</div>
                                <div id="neo-name" class="parameter-value">
                                </div>
                                <span id="neo-id" class="parameter-value"></span>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Primary designation</div>
                                <div id="neo-pdes" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">NASA archive ID</div>
                                <div id="neo-nid" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">SPK ID</div>
                                <div id="neo-spkid" class="parameter-value"></div>
                            </div>
                        </td>

                        <td>
                            <div class="parameter">
                                <div class="parameter-header">Absolute magnitude</div>
                                <div id="neo-mag" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Optical magnitude</div>
                                <div id="neo-vmag" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Est. integration time</div>
                                <div id="neo-integration" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Distance</div>
                                <div id="neo-obs2ast" class="parameter-value"></div> (<div id="neo-obs2astL1E" class="parameter-value"></div>)
                            </div>
                        </td>

                        <td>
                            <div class="parameter">
                                <div class="parameter-header">RIIC spectroscopies</div>
                                <div id="neo-spectnum" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">SMASSII class</div>
                                <div id="neo-smass" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Tholen class</div>
                                <div id="neo-tholen" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Distance to Sun</div>
                                <div id="neo-sun2ast" class="parameter-value"></div>
                            </div>
                        </td>

                        <td>
                            <div class="parameter">
                                <div class="parameter-header">Slew rate (max)</div>
                                <div id="neo-slew_current" class="parameter-value"></div> (<div id="neo-slew_max" class="parameter-value"></div>)
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Semi-major axis</div>
                                <div id="neo-a" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Eccentricity</div>
                                <div id="neo-e" class="parameter-value"></div>
                            </div>

                            <div class="parameter">
                                <div class="parameter-header">Inclination</div>
                                <div id="neo-i" class="parameter-value"></div>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>

            <div id="unknown-target-info" class="subject">
                No target selected
            </div>
        </fieldset>
    </div>

    <script src="<?php echo mix('app.js'); ?>"></script>

    <script type="text/javascript">
        App.pathFinder.data.reference_timestamp = <?php echo $time ?>*1;
        App.pathFinder.data.timestamp = <?php echo $time ?>*1;
    </script>
</body>
</html>
