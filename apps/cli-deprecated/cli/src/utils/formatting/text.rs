use ratatui::style::Stylize;

pub fn print_error(msg: &str) {
    println!("{}", msg.red().bold());
}
