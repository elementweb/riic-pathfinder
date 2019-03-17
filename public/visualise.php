<?php include 'includes/mix.php';?>
<!DOCTYPE html>
<html lang="en" class="no-js">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>RIIC Pathfinder Data Visualisation</title>

    <meta name="description" content="" />
    <meta name="keywords" content="" />
    <meta name="author" content="Kostas Gliozeris" />

    <link rel="shortcut icon" href="favicon.png">

    <link href="<?php echo mix('visualise.css'); ?>" rel="stylesheet">
    <link href="jquery-ui.min.css" rel="stylesheet">

    <!--[if lt IE 9]>
    <script src="https://oss.maxcdn.com/html5shiv/3.7.3/html5shiv.min.js"></script>
    <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>
    <![endif]-->
</head>
<body id="body-layout-main">
    <div class="container">
        <div id="visualisation-container" class="hidden">
            <div class="statistics">
                <table class="statistics-table">
                    <tr>
                        <td class="statistics-parameter">Start date:</td>
                        <td class="statistics-value"><span id="simulation-started"></span></td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">End date:</td>
                        <td class="statistics-value"><span id="simulation-ended"></span></td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Duration:</td>
                        <td class="statistics-value"><span id="duration"></span> days</td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Simulation timestep:</td>
                        <td class="statistics-value"><span id="simulation-timestep"></span> sec</td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Telescope size:</td>
                        <td class="statistics-value"><span id="telescope-size"></span></td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">NEOs scanned:</td>
                        <td class="statistics-value"><span id="neos-indicator"></span> <span id="neos-scanned"></span> (~<span id="neo-avg-scan-time"></span> min/scan) ~<span id="neos-per-day"></span>/day</td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Exoplanets scanned:</td>
                        <td class="statistics-value"><span id="exoplanets-indicator"></span> <span id="exoplanets-scanned"></span> (~<span id="exoplanet-avg-scan-time"></span> min/scan) ~<span id="exoplanets-per-day"></span>/day</td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">NEO population:</td>
                        <td class="statistics-value"><span id="neo-count"></span></td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Exoplanet population:</td>
                        <td class="statistics-value"><span id="exoplanet-count"></span> (<span id="observable-exoplanet-count"></span> observable at <span id="ecliptic-scope-2"></span>)</td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Scanning time breakdown:</td>
                        <td class="statistics-value">NEOs: <span id="time-neo-scans">0</span>%; exoplanets: <span id="time-exoplanet-scans">0</span>%; idle: <span id="time-idle">0</span>%</td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Max. slew rate:</td>
                        <td class="statistics-value"><span id="max-slew-rate"></span>&deg;/hr</td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Ecliptic scope; Earth excl. zone:</td>
                        <td class="statistics-value"><span id="ecliptic-scope"></span>; <span id="earth-exclusion"></span>&deg;</td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">NEO spectroscopy limiting:</td>
                        <td class="statistics-value"><span id="neo-spectroscopy-limiting"></span>, <span id="neo-spectroscopy-methodology"></span></td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Exoplanet spectroscopy limiting:</td>
                        <td class="statistics-value"><span id="exoplanet-spectroscopy-limiting"></span>, <span id="exoplanet-spectroscopy-methodology"></span></td>
                    </tr>

                    <tr>
                        <td class="statistics-parameter">Total data produced:</td>
                        <td class="statistics-value"><span id="total-data-produced"></span> Tb (<span id="data-rate-mbps"></span>±<span id="data-rate-fluct-mbps"></span> Mbps)</td>
                    </tr>
                </table>
            </div>

            <div class="operations" id="operation-container"></div>
        </div>
    </div>

    <script src="<?php echo mix('visualise.js'); ?>"></script>
    <script type="text/javascript">
        <?php
        if (isset($_GET['preset']) && file_exists('presets/' . basename($_GET['preset']))) {
            $json = file_get_contents('presets/' . basename($_GET['preset']));

            echo 'App.main.preset = JSON.parse(\'' . $json . '\');';
        }
        ?>
        App.main.load();
    </script>
</body>
</html>
