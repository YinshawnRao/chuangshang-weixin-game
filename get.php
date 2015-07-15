<?php
ini_set("display_errors", "On");
error_reporting(E_ALL | E_STRICT);
$ch = curl_init();

$str = $_POST["url"];
curl_setopt($ch, CURLOPT_URL, $str);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$output = curl_exec($ch);
echo $output;
?>