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

    <div id="pathfinder-controls">
        <div class="controls">
            <button id="button-initialize">Initialize</button>
            <button id="button-start">Start</button>
            <button id="button-stop">Stop</button>
        </div>

        <div class="status"><b>Status:</b> <span id="status">waiting</span></div>
    </div>

    <script src="<?php echo mix('app.js'); ?>"></script>

    <script type="text/javascript">
        App.pathFinder.data.timestamp = '<?php echo time() ?>';
    </script>
</body>
</html>
